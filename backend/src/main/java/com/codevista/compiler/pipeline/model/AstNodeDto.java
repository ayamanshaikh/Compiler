package com.codevista.compiler.pipeline.model;

import java.util.List;

/**
 * Hierarchical node representing an element in the Abstract Syntax Tree (AST).
 */
public record AstNodeDto(
        String id,
        String kind,
        String label,
        int line,
        int column,
        int endLine,
        int endColumn,
        String details,
        List<AstNodeDto> children
) {}
