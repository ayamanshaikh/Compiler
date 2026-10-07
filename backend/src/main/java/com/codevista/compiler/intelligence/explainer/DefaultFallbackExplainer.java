package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class DefaultFallbackExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        return diagnostic != null && diagnostic.getMessage() != null;
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        long line = diagnostic.getLine();
        String source = diagnostic.getSourceContext();

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation("Java compiler encountered a syntax or type issue on line " + line + ".")
                .whyItHappened("The code at this position does not conform to standard Java language grammar or typing rules.")
                .howToFix("Inspect line " + line + " and surrounding statements for syntax discrepancies, missing symbols, or unclosed delimiters.")
                .affectedLine(line)
                .relevantSource(source)
                .suggestion("Review the statement on line " + line + " according to Java syntax rules.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10000;
    }
}
