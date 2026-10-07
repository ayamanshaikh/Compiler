package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class TypeExpectedExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage().toLowerCase();
        return msg.contains("class, interface, enum, or record expected")
                || msg.contains("class, interface, or enum expected")
                || msg.contains("class or interface expected");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("Java expected a class, interface, enum, or record declaration here.")
                .whyItHappened("Executable code, methods, or stray characters were found outside of any enclosing class definition.")
                .howToFix("Enclose the statement or method inside a class body (e.g. 'public class Main { ... }').")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Wrap this code inside a class: public class Main { ... }")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
