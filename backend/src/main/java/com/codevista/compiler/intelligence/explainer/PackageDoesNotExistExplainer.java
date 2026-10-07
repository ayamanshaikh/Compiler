package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PackageDoesNotExistExplainer implements DiagnosticExplainer {

    private static final Pattern PACKAGE_PATTERN = Pattern.compile(
            "package\\s+([a-zA-Z0-9_$.]+)\\s+does not exist",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage().toLowerCase();
        return msg.contains("package") && msg.contains("does not exist");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = PACKAGE_PATTERN.matcher(msg);
        String pkg = matcher.find() ? matcher.group(1) : "the specified package";

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation("Java cannot find the package '" + pkg + "'.")
                .whyItHappened("The package name is either misspelled, or references a third-party library that is not present on the classpath.")
                .howToFix("Check for typos in your import statement (e.g. 'java.util' instead of 'java.utill'), or ensure the package is defined.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Verify the import statement spelling and package name.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
