package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class InvalidReturnTypeExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage().toLowerCase();
        return msg.contains("cannot return a value from a method with void result type")
                || msg.contains("missing return type")
                || msg.contains("return type required");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        String simple;
        String why;
        String fix;
        String suggestion;

        if (msg.toLowerCase().contains("void")) {
            simple = "This method is declared with a 'void' return type, but is attempting to return a value.";
            why = "A 'void' method explicitly promises not to produce a return value.";
            fix = "Either change 'void' to the data type you want to return (e.g. 'int', 'String'), or change 'return x;' to just 'return;'.";
            suggestion = "Change method return type from 'void' to the matching type or remove the returned value.";
        } else {
            simple = "The method declaration is missing a return type.";
            why = "In Java, every method (except constructors) must specify a return type (or 'void').";
            fix = "Add a return type before the method name (e.g., 'public void myMethod()' or 'public int myMethod()').";
            suggestion = "Specify a return type (like 'void' or 'int') before the method name.";
        }

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation(simple)
                .whyItHappened(why)
                .howToFix(fix)
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion(suggestion)
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
