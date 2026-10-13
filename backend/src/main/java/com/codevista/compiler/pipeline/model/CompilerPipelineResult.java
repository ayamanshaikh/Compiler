package com.codevista.compiler.pipeline.model;

import com.codevista.compiler.model.CompilerDiagnostic;

import java.util.Collections;
import java.util.List;

/**
 * Complete result representing the multi-stage compilation pipeline output.
 */
public record CompilerPipelineResult(
        boolean success,
        String sourceCode,
        String className,
        List<CompilerDiagnostic> diagnostics,
        List<CompilerStageInfo> stages,
        List<CompilerToken> tokens,
        AstNodeDto astRoot,
        List<CompilerSymbol> symbols,
        List<BytecodeInstructionDto> bytecode,
        String rawBytecodeOutput,
        long compilationTimeMs
) {
    public CompilerPipelineResult {
        diagnostics = diagnostics != null ? List.copyOf(diagnostics) : Collections.emptyList();
        stages = stages != null ? List.copyOf(stages) : Collections.emptyList();
        tokens = tokens != null ? List.copyOf(tokens) : Collections.emptyList();
        symbols = symbols != null ? List.copyOf(symbols) : Collections.emptyList();
        bytecode = bytecode != null ? List.copyOf(bytecode) : Collections.emptyList();
    }
}
