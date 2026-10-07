package com.codevista.compiler.core;

import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.Language;

/**
 * Language-independent compiler contract.
 * Concrete adapters implement this interface for specific language runtimes (Java, and in the future Python, C, C++).
 */
public interface LanguageCompiler {

    /**
     * Identifies the language handled by this adapter.
     */
    Language getSupportedLanguage();

    /**
     * Compiles source code in a sandboxed, isolated environment.
     */
    CompilationResult compile(CompilationRequest request);
}
