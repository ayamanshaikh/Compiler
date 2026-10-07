package com.codevista.compiler.adapter;

import com.codevista.compiler.core.LanguageCompiler;
import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.model.Language;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Production Java compiler adapter using the host environment's Java compiler.
 * Executes in isolated temporary directories with strict cleanup and zero persistent filesystem footprint.
 */
@Component
public class JavaCompilerAdapter implements LanguageCompiler {

    private static final Logger log = LoggerFactory.getLogger(JavaCompilerAdapter.class);

    private static final Pattern PUBLIC_TYPE_PATTERN = Pattern.compile(
            "public\\s+(?:final\\s+|abstract\\s+|sealed\\s+|non-sealed\\s+)?(?:class|interface|enum|record)\\s+([A-Za-z0-9_$]+)"
    );

    private static final Pattern ANY_TYPE_PATTERN = Pattern.compile(
            "(?:class|interface|enum|record)\\s+([A-Za-z0-9_$]+)"
    );

    private static final Pattern PACKAGE_PATTERN = Pattern.compile(
            "^\\s*package\\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\\.[a-zA-Z_][a-zA-Z0-9_]*)*)\\s*;",
            Pattern.MULTILINE
    );

    @Override
    public Language getSupportedLanguage() {
        return Language.JAVA;
    }

    @Override
    public CompilationResult compile(CompilationRequest request) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codevista_javac_");
            return compileInto(tempDir, request);
        } catch (IOException e) {
            log.error("Failed to create temporary compilation directory: {}", e.getMessage(), e);
            return CompilationResult.failure(
                    "Compiler initialization error: " + e.getMessage(),
                    List.of(new CompilerDiagnostic(1, 1, e.getMessage(), "", "ERROR", "COMPILER_EXCEPTION")),
                    0,
                    "Main"
            );
        } finally {
            if (tempDir != null) {
                deleteDirectoryRecursively(tempDir);
            }
        }
    }

    public CompilationResult compileInto(Path targetDir, CompilationRequest request) {
        String sourceCode = request.getSourceCode();
        if (sourceCode == null || sourceCode.isBlank()) {
            return CompilationResult.failure(
                    "Source code must not be empty.",
                    List.of(new CompilerDiagnostic(1, 1, "Source code must not be empty.", "", "ERROR", "EMPTY_SOURCE")),
                    0,
                    "Main"
            );
        }

        String className = determineClassName(request, sourceCode);
        String packageName = determinePackageName(sourceCode);
        long startTime = System.currentTimeMillis();

        try {
            Path sourceDir = targetDir;
            if (packageName != null && !packageName.isBlank()) {
                String packagePath = packageName.replace('.', File.separatorChar);
                sourceDir = targetDir.resolve(packagePath);
                Files.createDirectories(sourceDir);
            }

            Path sourceFile = sourceDir.resolve(className + ".java");
            Files.writeString(sourceFile, sourceCode, StandardCharsets.UTF_8);

            // Execute compilation
            javax.tools.JavaCompiler systemCompiler = ToolProvider.getSystemJavaCompiler();
            if (systemCompiler != null) {
                return compileWithSystemCompiler(systemCompiler, sourceFile, targetDir, sourceCode, className, startTime);
            } else {
                return compileWithExternalProcess(sourceFile, targetDir, sourceCode, className, startTime);
            }

        } catch (Exception e) {
            log.error("Compilation error in JavaCompilerAdapter: {}", e.getMessage(), e);
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);
            return CompilationResult.failure(
                    "Compiler internal error: " + e.getMessage(),
                    List.of(new CompilerDiagnostic(1, 1, e.getMessage(), "", "ERROR", "COMPILER_EXCEPTION")),
                    elapsed,
                    className
            );
        }
    }

    public String getFullyQualifiedClassName(CompilationRequest request) {
        String simpleName = determineClassName(request, request.getSourceCode());
        String packageName = determinePackageName(request.getSourceCode());
        if (packageName != null && !packageName.isBlank()) {
            return packageName + "." + simpleName;
        }
        return simpleName;
    }

    private CompilationResult compileWithSystemCompiler(
            javax.tools.JavaCompiler compiler,
            Path sourceFile,
            Path tempDir,
            String sourceCode,
            String className,
            long startTime
    ) {
        DiagnosticCollector<JavaFileObject> diagnosticCollector = new DiagnosticCollector<>();
        StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnosticCollector, Locale.ENGLISH, StandardCharsets.UTF_8);

        try {
            List<String> options = List.of(
                    "-d", tempDir.toAbsolutePath().toString(),
                    "-sourcepath", tempDir.toAbsolutePath().toString(),
                    "-proc:none",
                    "-encoding", "UTF-8"
            );

            List<File> compilationFiles = new ArrayList<>();
            try (var stream = Files.walk(tempDir)) {
                stream.filter(p -> p.toString().endsWith(".java"))
                        .forEach(p -> compilationFiles.add(p.toFile()));
            } catch (IOException e) {
                compilationFiles.add(sourceFile.toFile());
            }

            Iterable<? extends JavaFileObject> compilationUnits =
                    fileManager.getJavaFileObjectsFromFiles(compilationFiles);

            javax.tools.JavaCompiler.CompilationTask task =
                    compiler.getTask(null, fileManager, diagnosticCollector, options, null, compilationUnits);

            boolean success = Boolean.TRUE.equals(task.call());
            long elapsed = Math.max(1, System.currentTimeMillis() - startTime);

            List<String> sourceLines = Arrays.asList(sourceCode.split("\\r?\\n"));
            List<CompilerDiagnostic> diagnostics = new ArrayList<>();

            for (Diagnostic<? extends JavaFileObject> d : diagnosticCollector.getDiagnostics()) {
                long line = d.getLineNumber() > 0 ? d.getLineNumber() : 1;
                long col = d.getColumnNumber() > 0 ? d.getColumnNumber() : 1;
                String msg = d.getMessage(Locale.ENGLISH);
                String context = (line > 0 && line <= sourceLines.size())
                        ? sourceLines.get((int) line - 1).trim()
                        : "";
                String diagType = d.getKind().name();
                String code = d.getCode() != null ? d.getCode() : "JAVA_DIAGNOSTIC";

                diagnostics.add(new CompilerDiagnostic(line, col, msg, context, diagType, code));
            }

            if (success) {
                return CompilationResult.success("Compilation successful.", elapsed, className);
            } else {
                String summary = diagnostics.isEmpty()
                        ? "Compilation failed with unmapped errors."
                        : diagnostics.get(0).getMessage();
                return CompilationResult.failure(summary, diagnostics, elapsed, className);
            }

        } finally {
            try {
                fileManager.close();
            } catch (IOException e) {
                log.warn("Failed to close StandardJavaFileManager: {}", e.getMessage());
            }
        }
    }

    private CompilationResult compileWithExternalProcess(
            Path sourceFile,
            Path tempDir,
            String sourceCode,
            String className,
            long startTime
    ) throws IOException, InterruptedException {
        List<String> command = new ArrayList<>(List.of(
                "javac",
                "-d", tempDir.toAbsolutePath().toString(),
                "-sourcepath", tempDir.toAbsolutePath().toString(),
                "-proc:none",
                "-encoding", "UTF-8"
        ));

        try (var stream = Files.walk(tempDir)) {
            stream.filter(p -> p.toString().endsWith(".java"))
                    .forEach(p -> command.add(p.toAbsolutePath().toString()));
        } catch (IOException e) {
            command.add(sourceFile.toAbsolutePath().toString());
        }

        ProcessBuilder pb = new ProcessBuilder(command);

        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        long elapsed = Math.max(1, System.currentTimeMillis() - startTime);
        List<String> sourceLines = Arrays.asList(sourceCode.split("\\r?\\n"));

        if (exitCode == 0) {
            return CompilationResult.success("Compilation successful.", elapsed, className);
        } else {
            List<CompilerDiagnostic> diagnostics = parseProcessDiagnostics(output.toString(), sourceLines);
            String summary = diagnostics.isEmpty() ? output.toString().trim() : diagnostics.get(0).getMessage();
            return CompilationResult.failure(summary, diagnostics, elapsed, className);
        }
    }

    private List<CompilerDiagnostic> parseProcessDiagnostics(String output, List<String> sourceLines) {
        List<CompilerDiagnostic> list = new ArrayList<>();
        Pattern errorPattern = Pattern.compile(".*?\\.java:(\\d+):(?:(\\d+):)?\\s*(error|warning):\\s*(.*)");

        for (String line : output.split("\\r?\\n")) {
            Matcher m = errorPattern.matcher(line);
            if (m.find()) {
                long lineNum = Long.parseLong(m.group(1));
                long colNum = m.group(2) != null ? Long.parseLong(m.group(2)) : 1;
                String type = m.group(3).toUpperCase();
                String message = m.group(4);
                String context = (lineNum > 0 && lineNum <= sourceLines.size())
                        ? sourceLines.get((int) lineNum - 1).trim()
                        : "";

                list.add(new CompilerDiagnostic(lineNum, colNum, message, context, type, "JAVAC_CLI_DIAGNOSTIC"));
            }
        }

        if (list.isEmpty() && !output.isBlank()) {
            list.add(new CompilerDiagnostic(1, 1, output.trim(), "", "ERROR", "JAVAC_OUTPUT"));
        }

        return list;
    }

    private String determineClassName(CompilationRequest request, String sourceCode) {
        if (request.getClassName() != null && !request.getClassName().isBlank()) {
            return request.getClassName().trim();
        }

        Matcher publicMatcher = PUBLIC_TYPE_PATTERN.matcher(sourceCode);
        if (publicMatcher.find()) {
            return publicMatcher.group(1);
        }

        Matcher anyMatcher = ANY_TYPE_PATTERN.matcher(sourceCode);
        if (anyMatcher.find()) {
            return anyMatcher.group(1);
        }

        return "Main";
    }

    private String determinePackageName(String sourceCode) {
        Matcher packageMatcher = PACKAGE_PATTERN.matcher(sourceCode);
        if (packageMatcher.find()) {
            return packageMatcher.group(1);
        }
        return null;
    }

    public void deleteDirectoryRecursively(Path root) {
        try {
            Files.walkFileTree(root, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.deleteIfExists(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.deleteIfExists(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            log.warn("Failed to delete temp compilation directory {}: {}", root, e.getMessage());
        }
    }
}
