package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class InvalidConstructorArgumentsExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage().toLowerCase();
        return msg.contains("constructor") && (
                msg.contains("cannot be applied to given types")
                        || msg.contains("no suitable constructor found")
                        || msg.contains("actual and formal argument lists differ in length")
        );
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("The constructor arguments passed to 'new' do not match any available constructor for this class.")
                .whyItHappened("When you define a custom parameterized constructor, Java removes the default no-argument constructor. Calling 'new ClassName()' or passing mismatched arguments causes this error.")
                .howToFix("Pass the expected arguments to the constructor, or add an explicit no-argument constructor 'public ClassName() {}' to the class.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Match the constructor's parameters or define a matching constructor in the class.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
