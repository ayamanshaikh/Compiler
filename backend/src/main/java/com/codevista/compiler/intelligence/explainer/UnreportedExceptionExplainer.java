package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class UnreportedExceptionExplainer implements DiagnosticExplainer {

    private static final Pattern EXC_PATTERN = Pattern.compile(
            "unreported exception\\s+([a-zA-Z0-9_$.]+)",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("unreported exception");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = EXC_PATTERN.matcher(msg);
        String exceptionType = matcher.find() ? matcher.group(1) : "Exception";

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation("A checked exception ('" + exceptionType + "') can be thrown here, but it has not been handled.")
                .whyItHappened("Java enforces checked exception handling at compile time. Methods throwing checked exceptions require callers to either catch them or declare them in their method signature.")
                .howToFix("Either wrap the call in a 'try { ... } catch (" + exceptionType
                        + " e) { ... }' block, or add 'throws " + exceptionType + "' to the enclosing method signature.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Wrap with try-catch or add 'throws " + exceptionType + "' to method header.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
