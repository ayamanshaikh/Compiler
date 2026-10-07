package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StaticContextExplainer implements DiagnosticExplainer {

    private static final Pattern MEMBER_PATTERN = Pattern.compile(
            "non-static\\s+(variable|method)\\s+([a-zA-Z0-9_$()]+)\\s+cannot be referenced from a static context",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("cannot be referenced from a static context");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String msg = diagnostic.getMessage();
        Matcher matcher = MEMBER_PATTERN.matcher(msg);

        String memberType = "member";
        String memberName = "";

        if (matcher.find()) {
            memberType = matcher.group(1).toLowerCase();
            memberName = matcher.group(2);
        }

        String simple = memberName.isBlank()
                ? "You cannot access an instance member directly from a static method like 'main'."
                : "You cannot access the non-static " + memberType + " '" + memberName + "' directly from a static context.";
        String why = "Static methods belong to the class itself, whereas non-static variables and methods belong to specific instances created with 'new'.";
        String fix = "Either declare the " + memberType + " as 'static' (e.g. 'static int " + memberName
                + ";'), or instantiate the class first: 'new MyClass()." + memberName + "'.";
        String suggestion = memberName.isBlank()
                ? "Make the member static, or create an instance with 'new' first."
                : "Add 'static' modifier to " + memberName + ", or instantiate the class: new ClassName()." + memberName;

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
