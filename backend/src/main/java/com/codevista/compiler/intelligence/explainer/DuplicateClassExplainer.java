package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DuplicateClassExplainer implements DiagnosticExplainer {

    private static final Pattern CLASS_PATTERN = Pattern.compile(
            "duplicate class:\\s*([a-zA-Z0-9_$.]+)",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("duplicate class");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = CLASS_PATTERN.matcher(msg);
        String className = matcher.find() ? matcher.group(1) : "this class";

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation("The class '" + className + "' is already defined in this file or package.")
                .whyItHappened("Java does not allow two classes with the exact same name within the same package or source file.")
                .howToFix("Rename one of the classes to a unique name, or remove the duplicate definition.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Change the class name to something unique (e.g. 'class " + className + "2 { ... }').")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
