package com.codevista.compiler.service;

import com.codevista.compiler.core.LanguageCompiler;
import com.codevista.compiler.exception.UnsupportedLanguageException;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.model.Language;
import com.codevista.config.CacheConfig;
import com.codevista.dto.CompileRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates multi-language compilation by delegating to dedicated LanguageCompiler adapters
 * and enriching compilation diagnostics with pedagogical error explanations.
 */
@Service
public class CompilerService {

    private final Map<Language, LanguageCompiler> compilerMap = new EnumMap<>(Language.class);
    private final ErrorIntelligenceService errorIntelligenceService;

    public CompilerService(List<LanguageCompiler> compilers, ErrorIntelligenceService errorIntelligenceService) {
        for (LanguageCompiler compiler : compilers) {
            compilerMap.put(compiler.getSupportedLanguage(), compiler);
        }
        this.errorIntelligenceService = errorIntelligenceService;
    }

    @Cacheable(value = CacheConfig.COMPILATION_CACHE, key = "T(com.codevista.cache.CompilationCache).computeCompileKey(#request.language, #request.className, #request.sourceCode)")
    public CompilationResult compile(CompileRequest request) {
        if (request.getLanguage() == null || request.getLanguage().isBlank()) {
            throw new UnsupportedLanguageException("Language must not be blank. Supported language: " + Language.JAVA.getId());
        }

        Language language = Language.fromString(request.getLanguage());
        if (language == null) {
            throw new UnsupportedLanguageException(
                    "Unsupported language: '" + request.getLanguage() + "'. Currently supported: " + Language.JAVA.getId()
            );
        }

        LanguageCompiler compiler = compilerMap.get(language);
        if (compiler == null) {
            throw new UnsupportedLanguageException(
                    "Unsupported language: '" + request.getLanguage() + "'. No compiler adapter is currently registered."
            );
        }

        CompilationRequest internalRequest = new CompilationRequest(
                language,
                request.getSourceCode(),
                request.getClassName()
        );

        CompilationResult rawResult = compiler.compile(internalRequest);
        if (rawResult.getDiagnostics().isEmpty()) {
            return rawResult;
        }

        List<CompilerDiagnostic> enrichedDiagnostics = errorIntelligenceService.enrichDiagnostics(rawResult.getDiagnostics());
        return new CompilationResult(
                rawResult.isSuccess(),
                rawResult.getCompilerStatus(),
                rawResult.getOutput(),
                enrichedDiagnostics,
                rawResult.getCompilationTimeMs(),
                rawResult.getMainClass()
        );
    }
}
