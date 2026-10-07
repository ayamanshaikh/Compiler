package com.codevista.execution.service;

import com.codevista.compiler.exception.UnsupportedLanguageException;
import com.codevista.compiler.model.Language;
import com.codevista.dto.ExecuteRequest;
import com.codevista.execution.adapter.LanguageExecutor;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.execution.model.ExecutionResult;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ExecutionService {

    private final Map<Language, LanguageExecutor> executorMap = new EnumMap<>(Language.class);

    public ExecutionService(List<LanguageExecutor> executors) {
        for (LanguageExecutor executor : executors) {
            executorMap.put(executor.getSupportedLanguage(), executor);
        }
    }

    public ExecutionResult execute(ExecuteRequest request) {
        if (request.getLanguage() == null || request.getLanguage().isBlank()) {
            throw new UnsupportedLanguageException("Language must not be blank. Supported language: " + Language.JAVA.getId());
        }

        Language language = Language.fromString(request.getLanguage());
        if (language == null) {
            throw new UnsupportedLanguageException(
                    "Unsupported language: '" + request.getLanguage() + "'. Currently supported: " + Language.JAVA.getId()
            );
        }

        LanguageExecutor executor = executorMap.get(language);
        if (executor == null) {
            throw new UnsupportedLanguageException(
                    "Unsupported language: '" + request.getLanguage() + "'. No execution adapter is currently registered."
            );
        }

        ExecutionRequest internalRequest = new ExecutionRequest(
                language,
                request.getSourceCode(),
                request.getInput(),
                request.getClassName()
        );

        return executor.execute(internalRequest);
    }
}
