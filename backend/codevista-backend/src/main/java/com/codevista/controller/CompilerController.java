package com.codevista.controller;

import com.codevista.model.CompileRequest;
import com.codevista.model.CompileResponse;
import com.codevista.service.CompilerService;
import com.codevista.service.CompilerService.CompilationResult;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CompilerController {

    private final CompilerService compilerService;

    public CompilerController(CompilerService compilerService) {
        this.compilerService = compilerService;
    }

    @PostMapping("/compile")
    public CompileResponse compileCode(
            @RequestBody CompileRequest request
    ) {

        String code = request.getCode();

        if (code == null || code.trim().isEmpty()) {
            return new CompileResponse(
                    false,
                    "No code provided",
                    "Please write some Java code before running.",
                    "There is no Java code to compile yet.",
                    0,
                    "Write or paste some Java code and try again.",
                    ""
            );
        }

        CompilationResult result = compilerService.compileCode(code);

        if (result.isSuccess()) {
            return new CompileResponse(
                    true,
                    result.getMessage(),
                    null,
                    "Your Java code compiled and executed successfully.",
                    0,
                    null,
                    result.getOutput(),
                    result.getExecutionSteps(),
                    result.isExecutionTraceTruncated()
            );
        }

        String error = result.getMessage();
        long lineNumber = result.getLineNumber();
        String errorType = result.getErrorType();

        // Runtime error
        if (error != null && error.startsWith("Runtime Error:")) {
            return buildRuntimeResponse(error);
        }

        // Server error
        if (error != null && error.startsWith("Server Error:")) {
            return new CompileResponse(
                    false,
                    "Server error",
                    error,
                    "An internal server error occurred while processing your code.",
                    0,
                    "Try again in a moment. If the problem persists, check the server logs.",
                    ""
            );
        }

        // Compilation error
        if (lineNumber == 0) {
            lineNumber = extractLineNumber(error);
        }

        return new CompileResponse(
                false,
                "Compilation failed",
                error,
                explainError(error, errorType),
                lineNumber,
                getSuggestion(error, errorType),
                ""
        );
    }

    private CompileResponse buildRuntimeResponse(String error) {
        String runtimeDetail = error.substring("Runtime Error:".length()).trim();

        String explanation = explainRuntimeError(runtimeDetail);
        String suggestion = getRuntimeSuggestion(runtimeDetail);

        return new CompileResponse(
                false,
                "Runtime error",
                error,
                explanation,
                0,
                suggestion,
                ""
        );
    }

    private long extractLineNumber(String error) {

        if (error == null) {
            return 0;
        }

        try {
            // Match "Line N:" format from our CompilerService
            if (error.startsWith("Line ")) {
                String number = error
                        .substring(5)
                        .split(":")[0]
                        .trim();
                return Long.parseLong(number);
            }

            // Match javac format "Main.java:N:"
            if (error.contains("Main.java:")) {
                String[] parts = error.split("Main\\.java:");
                if (parts.length > 1) {
                    String numStr = parts[1].split("[^0-9]")[0];
                    return Long.parseLong(numStr);
                }
            }

        } catch (Exception e) {
            return 0;
        }

        return 0;
    }

    private String explainError(String error, String errorType) {

        if (error == null) {
            return "An unknown error occurred while compiling your Java code.";
        }

        switch (errorType) {
            case "MISSING_SEMICOLON":
                return "Java requires a semicolon (;) at the end of most statements. "
                        + "The semicolon tells the compiler where one instruction ends and the next begins.";

            case "CANNOT_FIND_SYMBOL":
                return "Java does not recognize a variable, method, or class used in your code. "
                        + "This typically happens because of a typo, using a variable before declaring it, "
                        + "or referencing a class that has not been imported.";

            case "INCOMPATIBLE_TYPES":
                return "You are trying to assign a value of one type to a variable of a different type. "
                        + "Java is strict about types — for example, you cannot assign a String to an int.";

            case "REACHED_END_OF_FILE":
                return "Your code ended before Java found all the closing brackets (}) it expected. "
                        + "Every opening bracket must have a matching closing bracket.";

            case "ILLEGAL_START":
                return "Java found code in a position where that type of statement is not allowed. "
                        + "This often means a statement is placed outside a method or class.";

            case "UNEXPECTED_TOKEN":
                return "Java found something that does not fit the expected program structure. "
                        + "Check that your classes, methods, and blocks are properly defined.";

            case "MISSING_RETURN":
                return "A method that declares a return type (like int, String, etc.) must return a value. "
                        + "Add a return statement with the correct type.";

            case "UNINITIALIZED_VARIABLE":
                return "You are trying to use a local variable that may not have been assigned a value yet. "
                        + "Java requires local variables to be initialized before use.";

            case "NON_STATIC_METHOD":
                return "You are trying to call a non-static method from a static context (like main). "
                        + "Create an instance of the class first, or make the method static.";

            case "ARRAY_REQUIRED":
                return "You used an array access expression ([]) on something that is not an array. "
                        + "Check that the variable is actually declared as an array.";

            case "TYPE_MISMATCH":
                return "There is a type mismatch in your code. "
                        + "The types involved are not compatible for the operation you are trying to perform.";

            case "UNCLOSED_BLOCK":
                return "There is an unclosed block in your code — a { that was never closed with }. "
                        + "Check your brackets and make sure every opening { has a matching }.";

            case "ILLEGAL_CHARACTER":
                return "Your code contains a character that is not valid in Java source code. "
                        + "Check for special Unicode characters or encoding issues.";

            default:
                return "The Java compiler found an error in your code. "
                        + "Check the indicated line number and the compiler message for details.";
        }
    }

    private String getSuggestion(String error, String errorType) {

        if (error == null) {
            return "Check your Java code and try compiling again.";
        }

        switch (errorType) {
            case "MISSING_SEMICOLON":
                return "Add a semicolon (;) at the end of the statement on the indicated line.";

            case "CANNOT_FIND_SYMBOL":
                return "Check the spelling of the identifier. Make sure the variable is declared "
                        + "before it is used, and that any required classes are imported.";

            case "INCOMPATIBLE_TYPES":
                return "Check the types of the variables involved. You may need to cast the value "
                        + "or change the variable type.";

            case "REACHED_END_OF_FILE":
                return "Count your opening and closing brackets. Every { must have a matching }.";

            case "ILLEGAL_START":
                return "Make sure all statements are inside a method body, and all methods are inside a class.";

            case "UNEXPECTED_TOKEN":
                return "Review the structure of your class and methods. Make sure declarations "
                        + "are in the correct position.";

            case "MISSING_RETURN":
                return "Add a return statement at the end of the method with the correct return type.";

            case "UNINITIALIZED_VARIABLE":
                return "Assign a value to the variable before using it.";

            case "NON_STATIC_METHOD":
                return "Either make the method static, or create an object of the class to call it.";

            case "ARRAY_REQUIRED":
                return "Check that the variable is declared as an array type (e.g., int[], String[]).";

            case "UNCLOSED_BLOCK":
                return "Add the missing closing bracket (}) to complete the block.";

            default:
                return "Review the indicated line and correct the syntax.";
        }
    }

    private String explainRuntimeError(String detail) {

        if (detail == null || detail.isEmpty()) {
            return "An error occurred while your program was running.";
        }

        String lower = detail.toLowerCase();

        if (lower.contains("arithmeticexception") || lower.contains("/ by zero")) {
            return "Your program tried to divide a number by zero. "
                    + "In Java, integer division by zero is not allowed and throws an ArithmeticException.";
        }

        if (lower.contains("nullpointerexception")) {
            return "Your program tried to use a reference that points to nothing (null). "
                    + "This happens when you call a method or access a field on a null object.";
        }

        if (lower.contains("arrayindexoutofboundsexception")) {
            return "Your program tried to access an array index that does not exist. "
                    + "Array indices start at 0, so the valid indices for an array of length N are 0 through N-1.";
        }

        if (lower.contains("stringindexoutofboundsexception")) {
            return "Your program tried to access a character position in a String that does not exist.";
        }

        if (lower.contains("classnotfoundexception")) {
            return "Java could not find a required class. "
                    + "This typically means a class name is misspelled or the file is missing.";
        }

        if (lower.contains("stackoverflowerror")) {
            return "Your program has infinite or very deep recursion. "
                    + "A method is calling itself without a proper base case to stop.";
        }

        if (lower.contains("outofmemoryerror")) {
            return "Your program ran out of memory. "
                    + "This can happen with very large data structures or infinite loops that create objects.";
        }

        if (lower.contains("numberformatexception")) {
            return "Your program tried to convert a String to a number, but the String was not in a valid number format.";
        }

        return "An error occurred while your program was running: " + detail;
    }

    private String getRuntimeSuggestion(String detail) {

        if (detail == null || detail.isEmpty()) {
            return "Check the runtime error message and review your code.";
        }

        String lower = detail.toLowerCase();

        if (lower.contains("arithmeticexception") || lower.contains("/ by zero")) {
            return "Add a check to ensure the divisor is not zero before performing division.";
        }

        if (lower.contains("nullpointerexception")) {
            return "Add a null check before using the reference. "
                    + "Make sure objects are initialized before calling methods on them.";
        }

        if (lower.contains("arrayindexoutofboundsexception")) {
            return "Check your loop bounds and array access. "
                    + "Make sure the index is always between 0 and arr.length - 1.";
        }

        if (lower.contains("stackoverflowerror")) {
            return "Add a base case to your recursive method to stop the recursion.";
        }

        if (lower.contains("numberformatexception")) {
            return "Validate the String format before converting it to a number.";
        }

        return "Check the runtime error and review the values used in your program.";
    }
}
