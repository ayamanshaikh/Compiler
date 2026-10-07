package com.codevista.compiler.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CompilationResult {

    private final boolean success;
    private final String compilerStatus;
    private final String output;
    private final List<CompilerDiagnostic> diagnostics;
    private final long compilationTimeMs;
    private final String mainClass;

    public CompilationResult(
            boolean success,
            String compilerStatus,
            String output,
            List<CompilerDiagnostic> diagnostics,
            long compilationTimeMs,
            String mainClass
    ) {
        this.success = success;
        this.compilerStatus = compilerStatus;
        this.output = output != null ? output : "";
        this.diagnostics = diagnostics != null ? new ArrayList<>(diagnostics) : Collections.emptyList();
        this.compilationTimeMs = compilationTimeMs;
        this.mainClass = mainClass;
    }

    public static CompilationResult success(String output, long compilationTimeMs, String mainClass) {
        return new CompilationResult(true, "SUCCESS", output, Collections.emptyList(), compilationTimeMs, mainClass);
    }

    public static CompilationResult failure(String output, List<CompilerDiagnostic> diagnostics, long compilationTimeMs, String mainClass) {
        return new CompilationResult(false, "ERROR", output, diagnostics, compilationTimeMs, mainClass);
    }

    public boolean isSuccess() {
        return success;
    }

    public String getCompilerStatus() {
        return compilerStatus;
    }

    public String getOutput() {
        return output;
    }

    public List<CompilerDiagnostic> getDiagnostics() {
        return Collections.unmodifiableList(diagnostics);
    }

    public long getCompilationTimeMs() {
        return compilationTimeMs;
    }

    public String getMainClass() {
        return mainClass;
    }
}
