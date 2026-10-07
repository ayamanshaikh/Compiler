package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class VariableNotInitializedExplainer implements DiagnosticExplainer {

    private static final Pattern VAR_PATTERN = Pattern.compile(
            "variable\\s+([a-zA-Z0-9_$]+)\\s+might not have been initialized",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("might not have been initialized");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = VAR_PATTERN.matcher(msg);
        String varName = matcher.find() ? matcher.group(1) : "the variable";

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation("The variable '" + varName + "' is read before it was guaranteed to have a value.")
                .whyItHappened("Local variables declared inside methods do not have default values in Java. You must assign them before reading them.")
                .howToFix("Initialize the variable when declaring it (e.g., 'int " + varName + " = 0;'), or assign it in every branch before use.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Initialize '" + varName + "' with an initial value before reading it.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
