package com.codevista.dto;

import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.CompilerDiagnostic;

import java.util.Collections;
import java.util.List;

public class CompileResponse {

    private boolean success;
    private String compilerStatus;
    private String output;
    private List<CompilerDiagnostic> diagnostics;
    private long compilationTimeMs;
    private String mainClass;

    public CompileResponse() {
    }

    public CompileResponse(boolean success, String compilerStatus, String output, List<CompilerDiagnostic> diagnostics, long compilationTimeMs, String mainClass) {
        this.success = success;
        this.compilerStatus = compilerStatus;
        this.output = output;
        this.diagnostics = diagnostics != null ? diagnostics : Collections.emptyList();
        this.compilationTimeMs = compilationTimeMs;
        this.mainClass = mainClass;
    }

    public CompileResponse(CompilationResult result) {
        this(
                result.isSuccess(),
                result.getCompilerStatus(),
                result.getOutput(),
                result.getDiagnostics(),
                result.getCompilationTimeMs(),
                result.getMainClass()
        );
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getCompilerStatus() {
        return compilerStatus;
    }

    public void setCompilerStatus(String compilerStatus) {
        this.compilerStatus = compilerStatus;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public List<CompilerDiagnostic> getDiagnostics() {
        return diagnostics;
    }

    public void setDiagnostics(List<CompilerDiagnostic> diagnostics) {
        this.diagnostics = diagnostics;
    }

    public long getCompilationTimeMs() {
        return compilationTimeMs;
    }

    public void setCompilationTimeMs(long compilationTimeMs) {
        this.compilationTimeMs = compilationTimeMs;
    }

    public String getMainClass() {
        return mainClass;
    }

    public void setMainClass(String mainClass) {
        this.mainClass = mainClass;
    }
}
