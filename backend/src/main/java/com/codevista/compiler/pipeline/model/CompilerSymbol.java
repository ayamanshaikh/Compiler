package com.codevista.compiler.pipeline.model;

/**
 * Represents an entry in the compiler's symbol table.
 */
public record CompilerSymbol(
        String name,
        String kind,
        String type,
        String scope,
        int line,
        int column,
        String initialValue
) {}
