package com.codevista.compiler.pipeline.model;

/**
 * Disassembled bytecode instruction with source line mapping and pedagogical explanation.
 */
public record BytecodeInstructionDto(
        int offset,
        String opcode,
        String arguments,
        int line,
        String explanation,
        String methodName
) {}
