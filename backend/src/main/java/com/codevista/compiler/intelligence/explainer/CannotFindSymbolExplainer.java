package com.codevista.compiler.intelligence.explainer;

import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CannotFindSymbolExplainer implements DiagnosticExplainer {

    private static final Pattern SYMBOL_PATTERN = Pattern.compile(
            "symbol:\\s*(variable|method|class)\\s+([a-zA-Z0-9_$]+)",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(CompilerDiagnostic diagnostic) {
        if (diagnostic == null || diagnostic.getMessage() == null) {
            return false;
        }
        return diagnostic.getMessage().toLowerCase().contains("cannot find symbol");
    }

    @Override
    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        String message = diagnostic.getMessage();
        Matcher matcher = SYMBOL_PATTERN.matcher(message);

        String symbolType = "symbol";
        String symbolName = "";

        if (matcher.find()) {
            symbolType = matcher.group(1).toLowerCase();
            symbolName = matcher.group(2);
        }

        String simple;
        String why;
        String fix;
        String suggestion;

        switch (symbolType) {
            case "variable" -> {
                simple = symbolName.isBlank()
                        ? "Java encountered a variable name that has not been declared or is out of scope."
                        : "The variable '" + symbolName + "' is used here, but Java doesn't recognize it.";
                why = "The variable was either never declared, has a typo in its name, or is outside the scope of this block.";
                fix = "Declare the variable before using it (e.g., 'int " + (symbolName.isBlank() ? "x" : symbolName)
                        + " = 0;'), check for typos, and verify variable scope.";
                suggestion = symbolName.isBlank() ? "Declare the variable before use" : "int " + symbolName + " = ...;";
            }
            case "method" -> {
                simple = symbolName.isBlank()
                        ? "Java attempted to call a method that does not exist."
                        : "The method '" + symbolName + "' was called, but Java cannot find a method with that name.";
                why = "The method is either misspelled, not defined in this class, or requires an object instance or import.";
                fix = "Verify the spelling of '" + (symbolName.isBlank() ? "method" : symbolName)
                        + "', ensure the method exists, or check the number and types of its arguments.";
                suggestion = symbolName.isBlank() ? "Verify method name and parameters" : "Check method signature: " + symbolName + "(...)";
            }
            case "class" -> {
                simple = symbolName.isBlank()
                        ? "Java cannot find the class or type used in this line."
                        : "Java cannot find the class '" + symbolName + "'.";
                why = "The class has not been defined in your file, or is a library class (like Scanner, List, or ArrayList) that has not been imported.";
                fix = "Import the required class at the top of your file (e.g., 'import java.util."
                        + (symbolName.isBlank() ? "Scanner" : symbolName) + ";') or verify the class name.";
                suggestion = symbolName.isBlank() ? "Add required import statement" : "import java.util." + symbolName + ";";
            }
            default -> {
                simple = "Java cannot find the symbol referenced on this line.";
                why = "The name is not defined in the current scope or requires an import statement.";
                fix = "Verify the spelling, check that the variable/method/class is declared, and verify imports.";
                suggestion = "Check spelling and declarations";
            }
        }

        return ErrorExplanation.builder()
                .technicalError(message)
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
