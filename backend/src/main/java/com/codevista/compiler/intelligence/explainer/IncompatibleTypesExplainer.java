package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class IncompatibleTypesExplainer implements DiagnosticExplainer {

    private static final Pattern TYPE_CONVERSION_PATTERN = Pattern.compile(
            "incompatible types:\\s*([^\\n]+)\\s+cannot be converted to\\s+([^\\n]+)",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("incompatible types");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = TYPE_CONVERSION_PATTERN.matcher(msg);

        String fromType = "the provided type";
        String toType = "the target type";

        if (matcher.find()) {
            fromType = matcher.group(1).trim();
            toType = matcher.group(2).trim();
        }

        String simple = "Cannot assign a value of type '" + fromType + "' to a variable of type '" + toType + "'.";
        String why = "Java is strongly typed. It does not automatically convert incompatible types without explicit conversion or casting.";
        String fix = "Match the variable type to '" + fromType + "', or explicitly convert/cast the value (e.g. Type casting or parsing methods).";
        String suggestion = "Ensure the assigned expression evaluates to '" + toType + "', or cast to (" + toType + ").";

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
