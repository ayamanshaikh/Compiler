package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class SemicolonExpectedExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage();
        return msg.contains("';' expected") || (msg.contains("expected") && msg.contains(";"));
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String source = diagnostic.getSourceContext();
        String suggestion = source != null && !source.isBlank()
                ? source.stripTrailing() + ";"
                : "Add ';' at the end of the statement";

        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("Java expected a semicolon (;) at the end of this statement.")
                .whyItHappened("In Java, statements must end with a semicolon to indicate where the instruction completes.")
                .howToFix("Add a semicolon (;) at the end of the statement on line " + diagnostic.getLine() + ".")
                .affectedLine(diagnostic.getLine())
                .relevantSource(source)
                .suggestion(suggestion)
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
