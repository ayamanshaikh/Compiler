package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;

public interface DiagnosticExplainer {

    /**
     * Determines whether this explainer can handle the given diagnostic.
     *
     * @param diagnostic the raw compiler diagnostic
     * @return true if this explainer matches the diagnostic
     */
    boolean supports(CompilerDiagnostic diagnostic);

    /**
     * Generates a pedagogical, beginner-friendly explanation for the diagnostic.
     *
     * @param diagnostic the raw compiler diagnostic
     * @return structured explanation containing why it occurred, how to fix it, and a suggestion
     */
    ErrorExplanation explain(CompilerDiagnostic diagnostic);

    /**
     * Priority order for explainer resolution. Lower values execute first.
     *
     * @return priority order
     */
    default int getOrder() {
        return 100;
    }
}
