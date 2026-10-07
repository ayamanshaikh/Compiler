package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class ReachedEofExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("reached end of file while parsing");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("The compiler reached the end of the file unexpectedly while parsing code.")
                .whyItHappened("One or more opening curly braces '{' or parentheses '(' were never closed with matching '}' or ')'.")
                .howToFix("Check each class and method body to verify every opening brace '{' has a corresponding closing brace '}'.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Add missing '}' at the end of the class block.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
