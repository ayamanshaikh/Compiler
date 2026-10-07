package com.codevista.execution.adapter;

import com.codevista.compiler.model.Language;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.execution.model.ExecutionResult;

public interface LanguageExecutor {

    /**
     * Returns the language supported by this execution adapter.
     */
    Language getSupportedLanguage();

    /**
     * Compiles and executes the source code in a sandboxed, isolated environment.
     *
     * @param request the execution request containing source, input, and options
     * @return the structured execution result
     */
    ExecutionResult execute(ExecutionRequest request);
}
