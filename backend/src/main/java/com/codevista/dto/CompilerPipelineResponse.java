package com.codevista.dto;

import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.pipeline.model.*;

import java.util.List;

public class CompilerPipelineResponse {

    private boolean success;
    private String sourceCode;
    private String className;
    private List<CompilerDiagnostic> diagnostics;
    private List<CompilerStageInfo> stages;
    private List<CompilerToken> tokens;
    private AstNodeDto astRoot;
    private List<CompilerSymbol> symbols;
    private List<BytecodeInstructionDto> bytecode;
    private String rawBytecodeOutput;
    private long compilationTimeMs;

    public CompilerPipelineResponse() {}

    public CompilerPipelineResponse(CompilerPipelineResult result) {
        this.success = result.success();
        this.sourceCode = result.sourceCode();
        this.className = result.className();
        this.diagnostics = result.diagnostics();
        this.stages = result.stages();
        this.tokens = result.tokens();
        this.astRoot = result.astRoot();
        this.symbols = result.symbols();
        this.bytecode = result.bytecode();
        this.rawBytecodeOutput = result.rawBytecodeOutput();
        this.compilationTimeMs = result.compilationTimeMs();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public List<CompilerDiagnostic> getDiagnostics() {
        return diagnostics;
    }

    public void setDiagnostics(List<CompilerDiagnostic> diagnostics) {
        this.diagnostics = diagnostics;
    }

    public List<CompilerStageInfo> getStages() {
        return stages;
    }

    public void setStages(List<CompilerStageInfo> stages) {
        this.stages = stages;
    }

    public List<CompilerToken> getTokens() {
        return tokens;
    }

    public void setTokens(List<CompilerToken> tokens) {
        this.tokens = tokens;
    }

    public AstNodeDto getAstRoot() {
        return astRoot;
    }

    public void setAstRoot(AstNodeDto astRoot) {
        this.astRoot = astRoot;
    }

    public List<CompilerSymbol> getSymbols() {
        return symbols;
    }

    public void setSymbols(List<CompilerSymbol> symbols) {
        this.symbols = symbols;
    }

    public List<BytecodeInstructionDto> getBytecode() {
        return bytecode;
    }

    public void setBytecode(List<BytecodeInstructionDto> bytecode) {
        this.bytecode = bytecode;
    }

    public String getRawBytecodeOutput() {
        return rawBytecodeOutput;
    }

    public void setRawBytecodeOutput(String rawBytecodeOutput) {
        this.rawBytecodeOutput = rawBytecodeOutput;
    }

    public long getCompilationTimeMs() {
        return compilationTimeMs;
    }

    public void setCompilationTimeMs(long compilationTimeMs) {
        this.compilationTimeMs = compilationTimeMs;
    }
}
