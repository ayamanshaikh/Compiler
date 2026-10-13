package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.pipeline.model.CompilerToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaLexerServiceTest {

    private JavaLexerService lexerService;

    @BeforeEach
    void setUp() {
        lexerService = new JavaLexerService();
    }

    @Test
    void testTokenizeBasicProgram() {
        String code = "public class Main {\n    int x = 10;\n}";
        List<CompilerToken> tokens = lexerService.tokenize(code);

        assertNotNull(tokens);
        assertFalse(tokens.isEmpty());

        // Check first token: public keyword
        CompilerToken first = tokens.get(0);
        assertEquals("public", first.value());
        assertEquals("KEYWORD", first.category());
        assertEquals(1, first.line());
        assertEquals(1, first.column());

        // Check identifier: Main
        CompilerToken second = tokens.get(2);
        assertEquals("Main", second.value());
        assertEquals("IDENTIFIER", second.category());

        // Find literal 10
        CompilerToken numToken = tokens.stream()
                .filter(t -> "10".equals(t.value()))
                .findFirst()
                .orElse(null);
        assertNotNull(numToken);
        assertEquals("LITERAL", numToken.category());
        assertEquals(2, numToken.line());
    }

    @Test
    void testTokenizeCommentsAndStrings() {
        String code = "// This is a comment\nString msg = \"Hello World\";";
        List<CompilerToken> tokens = lexerService.tokenize(code);

        assertTrue(tokens.stream().anyMatch(t -> "COMMENT".equals(t.category())));
        assertTrue(tokens.stream().anyMatch(t -> "\"Hello World\"".equals(t.value()) && "LITERAL".equals(t.category())));
    }
}
