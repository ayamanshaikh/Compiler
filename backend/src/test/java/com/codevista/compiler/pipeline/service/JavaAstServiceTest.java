package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.pipeline.model.AstNodeDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JavaAstServiceTest {

    private JavaAstService astService;

    @BeforeEach
    void setUp() {
        astService = new JavaAstService();
    }

    @Test
    void testParseValidClassAst() {
        String code = """
                public class Calculator {
                    public static int add(int a, int b) {
                        return a + b;
                    }
                }
                """;

        AstNodeDto root = astService.parseAst(code, "Calculator");
        assertNotNull(root);
        assertEquals("COMPILATION_UNIT", root.kind());
        assertFalse(root.children().isEmpty());

        // Find class node
        AstNodeDto classNode = root.children().stream()
                .filter(n -> "CLASS".equals(n.kind()))
                .findFirst()
                .orElse(null);
        assertNotNull(classNode);
        assertTrue(classNode.label().contains("Calculator"));

        // Find method node
        AstNodeDto methodNode = classNode.children().stream()
                .filter(n -> "METHOD".equals(n.kind()))
                .findFirst()
                .orElse(null);
        assertNotNull(methodNode);
        assertTrue(methodNode.label().contains("add"));
    }

    @Test
    void testParseEmptySourceReturnsEmptyNode() {
        AstNodeDto root = astService.parseAst("", "Main");
        assertNotNull(root);
        assertEquals("EMPTY", root.kind());
    }
}
