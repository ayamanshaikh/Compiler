package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class MissingReturnExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("missing return statement");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("This method promises to return a value, but is missing a 'return' statement.")
                .whyItHappened("Non-void methods in Java must guarantee that a value of the declared return type is returned across all possible execution paths (including if/else branches).")
                .howToFix("Add a 'return <value>;' statement before the method ends, and verify all code paths return a value.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Add 'return <value>;' at the end of the method body.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
