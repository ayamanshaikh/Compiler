package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ExceptionAlreadyCaughtExplainer implements DiagnosticExplainer {

    private static final Pattern EXC_PATTERN = Pattern.compile(
            "exception\\s+([a-zA-Z0-9_$.]+)\\s+has already been caught",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("has already been caught");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = EXC_PATTERN.matcher(msg);
        String exceptionType = matcher.find() ? matcher.group(1) : "this exception";

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation("The exception '" + exceptionType + "' is already caught by a preceding catch block.")
                .whyItHappened("In Java, catch blocks are evaluated from top to bottom. If a broader parent exception (such as Exception) appears before a specific child exception, the child block can never be reached.")
                .howToFix("Place specific catch blocks (subclasses) first, followed by broader catch blocks (superclasses).")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Reorder catch blocks: move '" + exceptionType + "' above broader parent catch blocks.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
