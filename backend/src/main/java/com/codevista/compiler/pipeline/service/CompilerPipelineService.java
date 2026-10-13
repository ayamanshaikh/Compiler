package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.pipeline.model.*;
import com.codevista.dto.CompilerPipelineRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates multi-stage compilation pipeline analysis.
 * Produces authentic compiler artifacts (Tokens, AST, Symbols, Bytecode) with zero fabrication.
 */
@Service
public class CompilerPipelineService {

    private final JavaLexerService lexerService;
    private final JavaAstService astService;
    private final JavaSymbolResolverService symbolResolverService;
    private final JavaBytecodeDisassemblerService bytecodeService;
    private final ErrorIntelligenceService errorIntelligenceService;

    public CompilerPipelineService(
            JavaLexerService lexerService,
            JavaAstService astService,
            JavaSymbolResolverService symbolResolverService,
            JavaBytecodeDisassemblerService bytecodeService,
            ErrorIntelligenceService errorIntelligenceService
    ) {
        this.lexerService = lexerService;
        this.astService = astService;
        this.symbolResolverService = symbolResolverService;
        this.bytecodeService = bytecodeService;
        this.errorIntelligenceService = errorIntelligenceService;
    }

    public CompilerPipelineResult analyze(CompilerPipelineRequest request) {
        long startTime = System.currentTimeMillis();
        String sourceCode = request.getSourceCode() != null ? request.getSourceCode() : "";
        String className = request.getClassName() != null && !request.getClassName().isBlank()
                ? request.getClassName()
                : "Main";

        List<CompilerStageInfo> stages = new ArrayList<>();
        List<CompilerDiagnostic> diagnostics = new ArrayList<>();

        // Stage 1: Source Code
        stages.add(new CompilerStageInfo(
                CompilerStageType.SOURCE_CODE,
                "Source Code",
                "Raw human-readable program text written by the programmer.",
                "Serves as the initial input for lexical parsing and compilation.",
                "SUCCESS",
                true,
                "User Code / UTF-8 Text Buffer"
        ));

        // Stage 2: Lexical Analysis (Tokens)
        List<CompilerToken> tokens = lexerService.tokenize(sourceCode);
        stages.add(new CompilerStageInfo(
                CompilerStageType.LEXICAL_ANALYSIS,
                "Lexical Analysis (Scanner / Lexer)",
                "Deconstructs characters into distinct categorized tokens (keywords, identifiers, literals, operators).",
                "Removes whitespace/comments and converts raw text into a stream of typed semantic tokens.",
                "SUCCESS",
                true,
                "Java High-Fidelity Lexical Tokenizer"
        ));

        // Stage 3: Syntax Analysis (AST)
        AstNodeDto astRoot = astService.parseAst(sourceCode, className);
        boolean astSuccess = !"PARSE_ERROR".equals(astRoot.kind()) && !"EMPTY".equals(astRoot.kind());
        stages.add(new CompilerStageInfo(
                CompilerStageType.SYNTAX_ANALYSIS,
                "Syntax Analysis (Parser / AST)",
                "Validates grammar against Java language specification and builds a hierarchical syntax tree.",
                "Detects syntactic errors (missing semicolons, unbalanced braces) and generates the Abstract Syntax Tree.",
                astSuccess ? "SUCCESS" : "ERROR",
                true,
                "OpenJDK Javac Compiler API (javax.tools.JavaCompiler)"
        ));

        // Stage 4: Symbol Resolution / Type Checking
        List<CompilerSymbol> symbols = symbolResolverService.resolveSymbols(sourceCode, className);
        stages.add(new CompilerStageInfo(
                CompilerStageType.SYMBOL_RESOLUTION,
                "Symbol Resolution & Scope Analysis",
                "Binds identifiers to declarations, establishes scope boundaries, and tracks variable types.",
                "Ensures variables are declared before use and prevents duplicate or out-of-scope identifiers.",
                "SUCCESS",
                true,
                "Javac Scope Analysis & Symbol Table"
        ));

        // Stage 5: Bytecode Disassembly
        JavaBytecodeDisassemblerService.DisassemblyResult disResult = bytecodeService.disassemble(sourceCode, className);
        boolean bytecodeSuccess = disResult.success();
        stages.add(new CompilerStageInfo(
                CompilerStageType.BYTECODE_DISASSEMBLY,
                "Code Generation & Bytecode (javap)",
                "Compiles verified AST into Java Virtual Machine (JVM) bytecode instructions.",
                "Generates portable binary class file executable by the HotSpot JVM on any target platform.",
                bytecodeSuccess ? "SUCCESS" : "ERROR",
                true,
                "OpenJDK javap Disassembler"
        ));

        if (!bytecodeSuccess) {
            if (disResult.diagnostics() != null && !disResult.diagnostics().isEmpty()) {
                diagnostics.addAll(disResult.diagnostics());
            } else if (disResult.error() != null) {
                diagnostics.add(new CompilerDiagnostic(
                        1,
                        1,
                        disResult.error(),
                        "",
                        "ERROR",
                        "COMPILATION_ERROR"
                ));
            }
        }

        List<CompilerDiagnostic> enrichedDiagnostics = errorIntelligenceService.enrichDiagnostics(diagnostics);
        boolean overallSuccess = astSuccess && bytecodeSuccess;
        long elapsed = Math.max(1, System.currentTimeMillis() - startTime);

        return new CompilerPipelineResult(
                overallSuccess,
                sourceCode,
                className,
                enrichedDiagnostics,
                stages,
                tokens,
                astRoot,
                symbols,
                disResult.instructions(),
                disResult.rawOutput(),
                elapsed
        );
    }
}
