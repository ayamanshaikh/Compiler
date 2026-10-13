package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.intelligence.explainer.*;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.pipeline.model.CompilerPipelineResult;
import com.codevista.compiler.pipeline.model.CompilerStageType;
import com.codevista.dto.CompilerPipelineRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CompilerPipelineServiceTest {

    private CompilerPipelineService pipelineService;

    @BeforeEach
    void setUp() {
        JavaLexerService lexer = new JavaLexerService();
        JavaAstService ast = new JavaAstService();
        JavaSymbolResolverService symbols = new JavaSymbolResolverService();
        JavaCompilerAdapter adapter = new JavaCompilerAdapter();
        JavaBytecodeDisassemblerService bytecode = new JavaBytecodeDisassemblerService(adapter);

        ErrorIntelligenceService errorService = new ErrorIntelligenceService(List.of(
                new SemicolonExpectedExplainer(),
                new CannotFindSymbolExplainer(),
                new DefaultFallbackExplainer()
        ));

        pipelineService = new CompilerPipelineService(lexer, ast, symbols, bytecode, errorService);
    }

    @Test
    void testAnalyzeValidProgramPipeline() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int sum = 0;
                        for (int i = 1; i <= 5; i++) {
                            sum += i;
                        }
                        System.out.println(sum);
                    }
                }
                """;

        CompilerPipelineRequest req = new CompilerPipelineRequest("JAVA", code, "Main");
        CompilerPipelineResult result = pipelineService.analyze(req);

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals("Main", result.className());

        // Check stages: all 5 stages must be present
        assertEquals(5, result.stages().size());
        assertTrue(result.stages().stream().anyMatch(s -> s.stage() == CompilerStageType.SOURCE_CODE));
        assertTrue(result.stages().stream().anyMatch(s -> s.stage() == CompilerStageType.LEXICAL_ANALYSIS));
        assertTrue(result.stages().stream().anyMatch(s -> s.stage() == CompilerStageType.SYNTAX_ANALYSIS));
        assertTrue(result.stages().stream().anyMatch(s -> s.stage() == CompilerStageType.SYMBOL_RESOLUTION));
        assertTrue(result.stages().stream().anyMatch(s -> s.stage() == CompilerStageType.BYTECODE_DISASSEMBLY));

        // Check tokens
        assertFalse(result.tokens().isEmpty());

        // Check AST
        assertNotNull(result.astRoot());
        assertEquals("COMPILATION_UNIT", result.astRoot().kind());

        // Check Symbols
        assertFalse(result.symbols().isEmpty());
        assertTrue(result.symbols().stream().anyMatch(s -> "sum".equals(s.name())));

        // Check Bytecode instructions
        assertFalse(result.bytecode().isEmpty());
        assertTrue(result.compilationTimeMs() >= 1);
    }

    @Test
    void testAnalyzeSyntaxErrorHaltsAtParserAndBytecode() {
        String invalidCode = "public class Broken { int x = ; }";
        CompilerPipelineRequest req = new CompilerPipelineRequest("JAVA", invalidCode, "Broken");
        CompilerPipelineResult result = pipelineService.analyze(req);

        assertNotNull(result);
        assertFalse(result.success());
        assertFalse(result.diagnostics().isEmpty());
    }
}
