package com.codevista.trace.service;

import com.codevista.compiler.exception.UnsupportedLanguageException;
import com.codevista.compiler.model.Language;
import com.codevista.config.CacheConfig;
import com.codevista.dto.TraceRequest;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.trace.adapter.JavaTraceExecutor;
import com.codevista.trace.model.ExecutionTrace;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class TraceService {

    private final JavaTraceExecutor javaTraceExecutor;

    public TraceService(JavaTraceExecutor javaTraceExecutor) {
        this.javaTraceExecutor = javaTraceExecutor;
    }

    @Cacheable(value = CacheConfig.TRACE_CACHE, key = "T(com.codevista.cache.CompilationCache).computeTraceKey(#request.language, #request.className, #request.sourceCode, #request.input)")
    public ExecutionTrace trace(TraceRequest request) {
        if (request.getLanguage() == null || request.getLanguage().isBlank()) {
            throw new UnsupportedLanguageException("Language must not be blank. Supported language: " + Language.JAVA.getId());
        }

        Language language = Language.fromString(request.getLanguage());
        if (language != Language.JAVA) {
            throw new UnsupportedLanguageException("Unsupported language for execution trace: '" + request.getLanguage() + "'. Currently supported: java");
        }

        ExecutionRequest execRequest = new ExecutionRequest(
                language,
                request.getSourceCode(),
                request.getInput(),
                request.getClassName()
        );

        return javaTraceExecutor.trace(execRequest);
    }
}
