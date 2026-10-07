package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class UnreachableStatementExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("unreachable statement");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("This statement can never be reached or executed by the program.")
                .whyItHappened("It appears immediately after a control-flow jump (such as 'return', 'break', 'continue', or 'throw'), or inside an impossible condition like 'while(false)'.")
                .howToFix("Move the code before the return/break/throw statement, or remove it if it is redundant.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Move the statement before the 'return'/'break'/'throw' statement or delete it.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
