package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

@Component
public class AccessModifierExplainer implements DiagnosticExplainer {

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        String msg = diagnostic.getMessage().toLowerCase();
        return msg.contains("has private access in")
                || msg.contains("has protected access in")
                || msg.contains("is not public in");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        String simple;
        String why;
        String fix;

        if (msg.toLowerCase().contains("private")) {
            simple = "You are trying to access a 'private' member from outside its declaring class.";
            why = "In Java, members marked 'private' are encapsulated and can only be accessed within the class where they are declared.";
            fix = "Use a public getter/setter method, or change the member's visibility to 'public' or package-private if appropriate.";
        } else if (msg.toLowerCase().contains("protected")) {
            simple = "You are trying to access a 'protected' member from a context without subclass or package privileges.";
            why = "'protected' members are only accessible within the same package or by subclasses.";
            fix = "Ensure the accessing class inherits from the declaring class or is located in the same package.";
        } else {
            simple = "This class or member is not public and cannot be accessed from outside its package.";
            why = "Package-private members are hidden from other packages.";
            fix = "Add the 'public' modifier to the class or member declaration if cross-package access is intended.";
        }

        return ErrorExplanation.builder()
                .technicalError(msg)
                .simpleExplanation(simple)
                .whyItHappened(why)
                .howToFix(fix)
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .suggestion("Access through a public method or increase the visibility modifier.")
                .build();
    }

    @Override
    public int getOrder() {
        return 10;
    }
}
