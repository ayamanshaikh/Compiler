package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.Language;
import com.codevista.compiler.pipeline.model.BytecodeInstructionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Disassembles genuine compiled Java bytecode using the host OpenJDK javap tool.
 * Accurately extracts JVM opcodes, method blocks, and correlates LineNumberTable to source lines.
 */
@Service
public class JavaBytecodeDisassemblerService {

    private static final Logger log = LoggerFactory.getLogger(JavaBytecodeDisassemblerService.class);

    private final JavaCompilerAdapter compilerAdapter;

    private static final Pattern OPCODE_PATTERN = Pattern.compile("^\\s*(\\d+):\\s+([a-z_0-9]+)(?:\\s+(.*))?$");
    private static final Pattern LINE_ENTRY_PATTERN = Pattern.compile("^\\s*line\\s+(\\d+):\\s+(\\d+)$");

    public record DisassemblyResult(
            boolean success,
            List<BytecodeInstructionDto> instructions,
            String rawOutput,
            String error,
            List<com.codevista.compiler.model.CompilerDiagnostic> diagnostics
    ) {
        public DisassemblyResult(boolean success, List<BytecodeInstructionDto> instructions, String rawOutput, String error) {
            this(success, instructions, rawOutput, error, List.of());
        }
    }

    public JavaBytecodeDisassemblerService(JavaCompilerAdapter compilerAdapter) {
        this.compilerAdapter = compilerAdapter;
    }

    public DisassemblyResult disassemble(String sourceCode, String className) {
        if (sourceCode == null || sourceCode.isBlank()) {
            return new DisassemblyResult(false, List.of(), "", "Source code is empty.");
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codevista_javap_");
            CompilationRequest compReq = new CompilationRequest(Language.JAVA, sourceCode, className);
            CompilationResult compRes = compilerAdapter.compileInto(tempDir, compReq);

            if (!compRes.isSuccess()) {
                return new DisassemblyResult(false, List.of(), "", "Compilation failed: " + compRes.getOutput(), compRes.getDiagnostics());
            }

            String targetClass = compRes.getMainClass();
            if (targetClass == null || targetClass.isBlank()) {
                targetClass = (className != null && !className.isBlank()) ? className : "Main";
            }

            // Locate .class file
            Path classFile = tempDir.resolve(targetClass + ".class");
            if (!Files.exists(classFile)) {
                // Search for any .class in directory
                try (var s = Files.walk(tempDir)) {
                    Optional<Path> found = s.filter(p -> p.toString().endsWith(".class")).findFirst();
                    if (found.isPresent()) {
                        classFile = found.get();
                    }
                }
            }

            if (!Files.exists(classFile)) {
                return new DisassemblyResult(false, List.of(), "", "No compiled .class file found for disassembly.");
            }

            // Determine javap binary path
            String javapCmd = resolveJavapPath();

            ProcessBuilder pb = new ProcessBuilder(
                    javapCmd,
                    "-c",
                    "-p",
                    "-l",
                    classFile.toAbsolutePath().toString()
            );
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);

            Process process = pb.start();
            StringBuilder rawOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    rawOutput.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                return new DisassemblyResult(false, List.of(), rawOutput.toString(), "javap exited with code " + exitCode);
            }

            List<BytecodeInstructionDto> instructions = parseJavapOutput(rawOutput.toString());
            return new DisassemblyResult(true, instructions, rawOutput.toString(), null);

        } catch (Exception e) {
            log.error("Bytecode disassembly failed: {}", e.getMessage(), e);
            return new DisassemblyResult(false, List.of(), "", "Disassembly error: " + e.getMessage());
        } finally {
            if (tempDir != null) {
                compilerAdapter.deleteDirectoryRecursively(tempDir);
            }
        }
    }

    private String resolveJavapPath() {
        String javaHome = System.getProperty("java.home");
        if (javaHome != null && !javaHome.isBlank()) {
            boolean isWin = System.getProperty("os.name", "").toLowerCase().contains("win");
            String binName = isWin ? "javap.exe" : "javap";
            Path p = Path.of(javaHome, "bin", binName);
            if (Files.exists(p)) {
                return p.toAbsolutePath().toString();
            }
        }
        return "javap";
    }

    private List<BytecodeInstructionDto> parseJavapOutput(String raw) {
        List<BytecodeInstructionDto> list = new ArrayList<>();
        String[] lines = raw.split("\\r?\\n");

        String currentMethod = "Class Members";
        boolean inCode = false;
        boolean inLineTable = false;

        // Temporary storage for instructions in the current method
        List<RawInstruction> currentMethodInstructions = new ArrayList<>();
        // Maps bytecode offset -> source line number
        TreeMap<Integer, Integer> offsetToLine = new TreeMap<>();

        for (String line : lines) {
            String trimmed = line.trim();

            if (trimmed.endsWith("{") || (trimmed.contains("(") && trimmed.contains(")") && !trimmed.contains(":") && !trimmed.startsWith("//"))) {
                // If switching method, flush previous method instructions
                flushMethod(currentMethodInstructions, offsetToLine, list);
                currentMethod = trimmed.replace(";", "").replace("{", "").trim();
                inCode = false;
                inLineTable = false;
                continue;
            }

            if ("Code:".equals(trimmed)) {
                inCode = true;
                inLineTable = false;
                continue;
            }

            if ("LineNumberTable:".equals(trimmed)) {
                inLineTable = true;
                inCode = false;
                continue;
            }

            if (inLineTable) {
                Matcher lm = LINE_ENTRY_PATTERN.matcher(trimmed);
                if (lm.matches()) {
                    int srcLine = Integer.parseInt(lm.group(1));
                    int bcOffset = Integer.parseInt(lm.group(2));
                    offsetToLine.put(bcOffset, srcLine);
                    continue;
                } else if (!trimmed.startsWith("line ") && !trimmed.isEmpty()) {
                    inLineTable = false;
                }
            }

            if (inCode) {
                Matcher m = OPCODE_PATTERN.matcher(line);
                if (m.find()) {
                    int offset = Integer.parseInt(m.group(1));
                    String opcode = m.group(2);
                    String args = m.group(3) != null ? m.group(3).trim() : "";
                    currentMethodInstructions.add(new RawInstruction(offset, opcode, args, currentMethod));
                }
            }
        }

        // Final flush
        flushMethod(currentMethodInstructions, offsetToLine, list);

        return list;
    }

    private void flushMethod(
            List<RawInstruction> rawList,
            TreeMap<Integer, Integer> lineTable,
            List<BytecodeInstructionDto> result
    ) {
        if (rawList.isEmpty()) return;

        for (RawInstruction raw : rawList) {
            int line = 1;
            if (!lineTable.isEmpty()) {
                Map.Entry<Integer, Integer> floor = lineTable.floorEntry(raw.offset);
                if (floor != null) {
                    line = floor.getValue();
                } else {
                    line = lineTable.firstEntry().getValue();
                }
            }

            String explanation = explainOpcode(raw.opcode, raw.args);
            result.add(new BytecodeInstructionDto(
                    raw.offset,
                    raw.opcode,
                    raw.args,
                    line,
                    explanation,
                    raw.methodName
            ));
        }

        rawList.clear();
        lineTable.clear();
    }

    private record RawInstruction(int offset, String opcode, String args, String methodName) {}

    private String explainOpcode(String opcode, String args) {
        if (opcode.startsWith("iconst_")) return "Push integer constant onto operand stack.";
        if (opcode.startsWith("bipush")) return "Push byte integer (" + args + ") onto operand stack.";
        if (opcode.startsWith("sipush")) return "Push short integer (" + args + ") onto operand stack.";
        if (opcode.startsWith("ldc")) return "Push constant reference (" + args + ") from runtime constant pool.";
        if (opcode.startsWith("iload")) return "Load integer from local variable slot into operand stack.";
        if (opcode.startsWith("aload")) return "Load reference pointer from local variable slot into operand stack.";
        if (opcode.startsWith("istore")) return "Store integer from operand stack into local variable slot.";
        if (opcode.startsWith("astore")) return "Store reference pointer from operand stack into local variable slot.";
        if (opcode.equals("iadd")) return "Pop two integers, calculate sum, push result onto stack.";
        if (opcode.equals("isub")) return "Pop two integers, calculate difference, push result onto stack.";
        if (opcode.equals("imul")) return "Pop two integers, calculate product, push result onto stack.";
        if (opcode.equals("idiv")) return "Pop two integers, calculate quotient, push result onto stack.";
        if (opcode.equals("irem")) return "Pop two integers, calculate remainder, push result onto stack.";
        if (opcode.startsWith("iinc")) return "Increment local variable directly without modifying stack.";
        if (opcode.startsWith("getstatic")) return "Retrieve static field (" + args + ") onto operand stack.";
        if (opcode.startsWith("invokevirtual")) return "Dispatch instance method via vtable virtual call.";
        if (opcode.startsWith("invokespecial")) return "Invoke constructor (<init>) or private/super method.";
        if (opcode.startsWith("invokestatic")) return "Invoke static method without instance reference.";
        if (opcode.startsWith("if_icmp")) return "Compare two integers on stack and branch if condition passes.";
        if (opcode.startsWith("if")) return "Compare stack value against zero and branch if condition passes.";
        if (opcode.equals("goto")) return "Unconditional jump to branch target offset.";
        if (opcode.equals("new")) return "Allocate uninitialized object on heap.";
        if (opcode.equals("newarray")) return "Allocate primitive array buffer on heap.";
        if (opcode.equals("anewarray")) return "Allocate reference array buffer on heap.";
        if (opcode.equals("arraylength")) return "Get array length from heap instance.";
        if (opcode.startsWith("iaload") || opcode.startsWith("aaload")) return "Retrieve element from array at index.";
        if (opcode.startsWith("iastore") || opcode.startsWith("aastore")) return "Store value into array buffer at index.";
        if (opcode.equals("return")) return "Void return from method, popping active stack frame.";
        if (opcode.equals("ireturn") || opcode.equals("areturn")) return "Return value from method to caller frame.";

        return "JVM instruction execution.";
    }
}
