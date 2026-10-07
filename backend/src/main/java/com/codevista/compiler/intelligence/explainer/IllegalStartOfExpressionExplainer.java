package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class IllegalStartOfExpressionExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("illegal start of expression");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String source = diagnostic.getSourceContext();
        String fixSuggestion = "Check syntax and remove misplaced modifiers or brackets.";
        if (source != null) {
            if (source.contains("public") || source.contains("private") || source.contains("protected")) {
                fixSuggestion = "Access modifiers cannot be placed inside a method body. Declare variables without 'public'/'private'.";
            } else if (source.contains("void") || source.contains("class")) {
                fixSuggestion = "Methods cannot be declared inside other methods. Move this declaration to the class level.";
            }
        }

        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("Java encountered a keyword or symbol that cannot legally start an expression here.")
                .whyItHappened("Common causes include nesting a method inside another method, placing access modifiers (public/private) inside a method body, or unmatched closing braces.")
                .howToFix("Check if a method was defined inside another method, or if a variable was declared with an access modifier inside a method.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(source)
                .suggestion(fixSuggestion)
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
