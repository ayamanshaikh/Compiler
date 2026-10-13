package com.codevista.compiler.pipeline.model;

/**
 * Enumeration of distinct stages in the compiler pipeline.
 */
public enum CompilerStageType {
    SOURCE_CODE,
    LEXICAL_ANALYSIS,
    SYNTAX_ANALYSIS,
    SYMBOL_RESOLUTION,
    BYTECODE_DISASSEMBLY
}
