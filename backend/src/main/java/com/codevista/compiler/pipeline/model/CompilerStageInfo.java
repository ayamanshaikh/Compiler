package com.codevista.compiler.pipeline.model;

/**
 * Educational metadata describing a compilation pipeline stage.
 */
public record CompilerStageInfo(
        CompilerStageType stage,
        String name,
        String description,
        String purpose,
        String status,
        boolean isRealOutput,
        String toolchain
) {}
