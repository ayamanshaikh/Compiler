package com.codevista.compiler.pipeline.model;

/**
 * Represents a single token emitted by lexical analysis.
 */
public record CompilerToken(
        int index,
        String type,
        String value,
        int line,
        int column,
        int endColumn,
        String category
) {}
