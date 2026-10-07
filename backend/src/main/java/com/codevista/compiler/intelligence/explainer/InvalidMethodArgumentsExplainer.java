package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class InvalidMethodArgumentsExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage().toLowerCase();
        boolean isMethodError = msg.contains("method") || msg.contains("argument lists differ");
        boolean isNotConstructor = !msg.contains("constructor");

        return isNotConstructor && (
                msg.contains("cannot be applied to given types")
                        || msg.contains("no suitable method found")
                        || msg.contains("actual and formal argument lists differ in length")
        );
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("The arguments passed to the method do not match its declared parameters.")
                .whyItHappened("The method expects different argument types, or a different number of arguments than what was supplied in the call.")
                .howToFix("Check the method signature and ensure the types, number, and order of passed arguments exactly match.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Verify the arguments and pass values matching the method's parameter list.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
