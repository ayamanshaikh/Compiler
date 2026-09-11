package com.codevista.controller;

import com.codevista.model.CompileRequest;
import com.codevista.model.CompileResponse;
import com.codevista.model.HistoryEntry;
import com.codevista.service.CompilerService;
import com.codevista.service.CompilerService.CompilationResult;
import com.codevista.service.HistoryService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${codevista.cors.allowed-origins:*}")
public class CompilerController {

    private final CompilerService compilerService;
    private final HistoryService historyService;
    private final int maxCodeLength;

    public CompilerController(
            CompilerService compilerService,
            HistoryService historyService,
            @Value("${codevista.execution.max-code-length:100000}") int maxCodeLength
    ) {
        this.compilerService = compilerService;
        this.historyService = historyService;
        this.maxCodeLength = maxCodeLength;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "service", "codevista-backend",
                "javaVersion", System.getProperty("java.version")
        );
    }

    @GetMapping("/history")
    public List<HistoryEntry> history() {
        return historyService.recent();
    }

    @PostMapping("/compile")
    public CompileResponse compileCode(@RequestBody CompileRequest request) {

        String code = request.getCode();
        String language = normalizeLanguage(request.getLanguage());

        // Unsupported language — reject early so future languages slot in
        // behind the same validation seam.
        if (!"java".equals(language)) {
            CompileResponse response = new CompileResponse(
                    false,
                    "Unsupported language",
                    "Language \"" + request.getLanguage()
                            + "\" is not supported yet.",
                    "CodeVista currently supports Java. Other languages are planned.",
                    0,
                    "Use language \"java\".",
                    ""
            );
            historyService.record(language, code, false,
                    response.getMessage(), null, response.getError());
            return response;
        }

        if (code == null || code.trim().isEmpty()) {
            CompileResponse response = new CompileResponse(
                    false,
                    "No code provided",
                    "Please write some Java code before running.",
                    "There is no Java code to compile yet.",
                    0,
                    "Write or paste some Java code and try again.",
                    ""
            );
            historyService.record(language, code, false,
                    response.getMessage(), null, response.getError());
            return response;
        }

        if (code.length() > maxCodeLength) {
            CompileResponse response = new CompileResponse(
                    false,
                    "Source code too large",
                    "Your code exceeds the maximum length of "
                            + maxCodeLength + " characters.",
                    "CodeVista limits submissions to keep execution safe and fast.",
                    0,
                    "Reduce the size of your program and try again.",
                    ""
            );
            historyService.record(language, code, false,
                    response.getMessage(), null, response.getError());
            return response;
        }

        CompilationResult result = compilerService.compileCode(code);

        CompileResponse response;

        if (result.isSuccess()) {
            response = new CompileResponse(
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
        } else {

            String error = result.getMessage();
            long lineNumber = result.getLineNumber();

            // Runtime error
            if (error != null && error.startsWith("Runtime Error:")) {
                response = buildRuntimeResponse(error, lineNumber, result.getOutput());
            }
            // Server error
            else if (error != null && error.startsWith("Server Error:")) {
                response = new CompileResponse(
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
            else {
                if (lineNumber == 0) {
                    lineNumber = extractLineNumber(error);
                }

                response = new CompileResponse(
                        false,
                        "Compilation failed",
                        error,
                        explainError(error, result.getErrorType()),
                        lineNumber,
                        getSuggestion(error, result.getErrorType()),
                        ""
                );
            }
        }

        historyService.record(
                language,
                code,
                response.isSuccess(),
                response.getMessage(),
                response.getOutput(),
                response.getError()
        );

        return response;
    }

    private static String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "java";
        }
        return language.trim().toLowerCase(Locale.ROOT);
    }

    private CompileResponse buildRuntimeResponse(String error, long lineNumber, String output) {
        String runtimeDetail = error.substring("Runtime Error:".length()).trim();

        return new CompileResponse(
                false,
                "Runtime error",
                error,
                explainRuntimeError(runtimeDetail),
                lineNumber,
                getRuntimeSuggestion(runtimeDetail),
                output == null ? "" : output
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

            // ── Methods & constructors ─────────────────────────────────
            case "METHOD_ARGUMENT_MISMATCH":
                return "You are calling a method with arguments that do not match its parameter list. "
                        + "This usually means the wrong number of arguments, the wrong order, or a type mismatch. "
                        + "Java matches each argument to a parameter position by both count and type.";

            case "NO_SUITABLE_METHOD":
                return "Java looked for a method with the name and argument types you used, but no matching method exists. "
                        + "This happens when the method name is misspelled or the argument types do not match any overload.";

            case "CONSTRUCTOR_MISMATCH":
                return "You are creating an object with arguments that do not match any constructor of the class. "
                        + "Every class has one or more constructors, each with its own parameter list; your call must match one of them.";

            case "CONSTRUCTOR_NOT_FOUND":
                return "The class does not have a constructor that matches the way you are creating it. "
                        + "If you defined a constructor with parameters, Java no longer provides a default no-argument constructor.";

            // ── Generics & lambdas ─────────────────────────────────────
            case "GENERIC_INFERENCE":
                return "Java could not figure out the type parameters (the types inside < >) from the way you used the code. "
                        + "Type inference failed, usually because the surrounding code does not give enough information.";

            case "GENERIC_TYPE_ARGUMENT":
                return "There is a problem with the type arguments inside < > — either the wrong type, the wrong number, "
                        + "or a type that does not satisfy the bound (like extends Comparable).";

            case "NOT_FUNCTIONAL_INTERFACE":
                return "You used a lambda expression (->) where the target type is not a functional interface. "
                        + "A lambda can only be assigned to an interface that has exactly one abstract method.";

            // ── Inheritance & OOP ──────────────────────────────────────
            case "ABSTRACT_NOT_IMPLEMENTED":
                return "Your class inherits abstract methods (methods declared without a body) but does not implement them. "
                        + "A concrete class must provide a body for every inherited abstract method, or be declared abstract itself.";

            case "CANNOT_OVERRIDE":
                return "A method in a subclass tries to override a superclass method, but Java does not allow it here. "
                        + "Common causes: the superclass method is final, private, or static, or the override has a weaker access modifier.";

            // ── Scope & statics ────────────────────────────────────────
            case "STATIC_CONTEXT_REFERENCE":
                return "You are trying to use an instance member (a non-static variable or method) from a static context like main. "
                        + "Static methods belong to the class, so they cannot see instance state that only exists per object.";

            case "VARIABLE_ALREADY_DEFINED":
                return "You defined two variables with the same name in the same scope (block or method). "
                        + "Java does not allow a name to be defined twice in the same scope — rename one of them.";

            // ── Classes & packages ─────────────────────────────────────
            case "DUPLICATE_CLASS":
                return "You defined a class with the same name twice, or two classes with the same name exist in the same package. "
                        + "Class names must be unique within their package.";

            case "PUBLIC_CLASS_FILENAME":
                return "A public class must live in a file whose name matches the class name. "
                        + "Since CodeVista compiles a file called Main.java, your public class must be named Main.";

            case "PACKAGE_NOT_FOUND":
                return "You used a package that Java cannot find. "
                        + "This usually means the package name is misspelled, the library is not on the classpath, "
                        + "or the import statement references a package that does not exist.";

            // ── Control flow ───────────────────────────────────────────
            case "UNREACHABLE_STATEMENT":
                return "Java found code that can never run because the statement before it always exits the method or loop. "
                        + "For example, statements after a return are unreachable — Java rejects them as a likely mistake.";

            case "BREAK_OUTSIDE_LOOP":
                return "You used the break keyword somewhere it is not allowed — it only works inside a loop or a switch. "
                        + "Remove it or move it inside the loop/switch.";

            case "CONTINUE_OUTSIDE_LOOP":
                return "You used the continue keyword outside of a loop. "
                        + "continue only makes sense inside for, while, or do-while loops.";

            // ── Exceptions ─────────────────────────────────────────────
            case "UNREPORTED_EXCEPTION":
                return "Your code calls something that can throw a checked exception, but neither catches it nor declares it. "
                        + "Java forces you to handle checked exceptions: wrap the call in try/catch or add throws to the method.";

            // ── Types & operators ──────────────────────────────────────
            case "INCOMPARABLE_TYPES":
                return "You are comparing two values that cannot be compared with each other. "
                        + "For example, == between two unrelated object types, or < between a String and a number.";

            case "BAD_OPERAND_TYPES":
                return "The operator you used does not work with the operands (the values on either side). "
                        + "For example, + needs numbers or strings, and % (modulo) needs numeric types.";

            case "OPERATOR_APPLICATION":
                return "You applied an operator to values of a type it does not support. "
                        + "Check the types on both sides of the operator and make sure the operation makes sense for them.";

            case "ILLEGAL_START_TYPE":
                return "Java found something where a type declaration was expected — usually a missing modifier, "
                        + "a stray closing brace, or a statement accidentally placed outside a class or method.";

            // ── Arrays ─────────────────────────────────────────────────
            case "ARRAY_DIMENSION_MISSING":
                return "You declared an array with empty square brackets but did not give its size. "
                        + "An array declaration needs either a size (new int[5]) or an initializer list ({1, 2, 3}).";

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

            // ── Methods & constructors ─────────────────────────────────
            case "METHOD_ARGUMENT_MISMATCH":
                return "Check the method's parameter list (its signature). Make sure you pass the same number "
                        + "of arguments in the same order, each with a compatible type.";

            case "NO_SUITABLE_METHOD":
                return "Check the method name and the types of the arguments you are passing. "
                        + "If the method is overloaded, make sure your argument types match one of the overloads exactly.";

            case "CONSTRUCTOR_MISMATCH":
                return "Look at the constructors defined in the class and call one with matching arguments, "
                        + "or add a constructor that accepts the arguments you are passing.";

            case "CONSTRUCTOR_NOT_FOUND":
                return "Add a matching constructor to the class, or change your new call to match an existing constructor. "
                        + "Remember: defining any constructor removes the default no-argument one.";

            // ── Generics & lambdas ─────────────────────────────────────
            case "GENERIC_INFERENCE":
                return "Specify the type arguments explicitly (e.g., new ArrayList<String>() instead of new ArrayList<>()) "
                        + "or check that the generic type used on both sides of the assignment is consistent.";

            case "GENERIC_TYPE_ARGUMENT":
                return "Make sure the types inside < > match the generic class's declared type parameters "
                        + "and satisfy any bounds (e.g., T extends Number means you cannot pass String).";

            case "NOT_FUNCTIONAL_INTERFACE":
                return "Use an interface that has exactly one abstract method, or create a lambda-compatible "
                        + "functional interface (like Runnable, Comparator, or a custom @FunctionalInterface).";

            // ── Inheritance & OOP ──────────────────────────────────────
            case "ABSTRACT_NOT_IMPLEMENTED":
                return "Implement all inherited abstract methods in your class, or declare your class abstract. "
                        + "The compiler message lists the methods you still need to provide.";

            case "CANNOT_OVERRIDE":
                return "Match the superclass method's signature exactly and keep the access modifier the same or more permissive. "
                        + "You cannot override final, private, or static methods.";

            // ── Scope & statics ────────────────────────────────────────
            case "STATIC_CONTEXT_REFERENCE":
                return "Create an instance of the class first and call the member through it, "
                        + "or declare the variable/method as static if it does not depend on instance state.";

            case "VARIABLE_ALREADY_DEFINED":
                return "Rename one of the variables, or declare the second one in a different (inner) scope "
                        + "so the two names do not collide.";

            // ── Classes & packages ─────────────────────────────────────
            case "DUPLICATE_CLASS":
                return "Remove the duplicate class definition or rename one of the classes so each name is unique.";

            case "PUBLIC_CLASS_FILENAME":
                return "Rename your public class to Main (CodeVista compiles Main.java), "
                        + "or make the class non-public so its name does not need to match the file.";

            case "PACKAGE_NOT_FOUND":
                return "Check the spelling of the package in your import statement, and make sure any required "
                        + "library is available. Remove the import if you do not actually use that package.";

            // ── Control flow ───────────────────────────────────────────
            case "UNREACHABLE_STATEMENT":
                return "Remove the unreachable code, or move it before the return/break that precedes it.";

            case "BREAK_OUTSIDE_LOOP":
                return "Remove the stray break, or move it inside the loop or switch block where it belongs.";

            case "CONTINUE_OUTSIDE_LOOP":
                return "Remove the stray continue, or move it inside the loop body.";

            // ── Exceptions ─────────────────────────────────────────────
            case "UNREPORTED_EXCEPTION":
                return "Wrap the call in a try/catch block for the exception type shown, "
                        + "or add throws to the enclosing method's signature.";

            // ── Types & operators ──────────────────────────────────────
            case "INCOMPARABLE_TYPES":
                return "Compare the same kind of values. Use equals() to compare objects' contents "
                        + "instead of ==, and only use < > on numbers.";

            case "BAD_OPERAND_TYPES":
                return "Check what the operator expects: use numbers for arithmetic, "
                        + "and convert types first (e.g., Integer.parseInt) if needed.";

            case "OPERATOR_APPLICATION":
                return "Convert one side of the operator to a compatible type before applying it, "
                        + "or use the correct operator for the types involved.";

            case "ILLEGAL_START_TYPE":
                return "Check for a missing brace or a statement placed outside a class/method body, "
                        + "and make sure each opening { has a matching }.";

            // ── Arrays ─────────────────────────────────────────────────
            case "ARRAY_DIMENSION_MISSING":
                return "Give the array a size (new int[5]) or an initializer ({1, 2, 3}) at its declaration.";

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

        if (lower.contains("classcastexception")) {
            return "Your program tried to treat an object as a different type than it actually is. "
                    + "A cast failed because the object's real type is not compatible with the target type.";
        }

        if (lower.contains("illegalargumentexception")) {
            return "Your program passed an invalid or inappropriate value to a method. "
                    + "The method received an argument that violates its contract (for example, a negative size).";
        }

        if (lower.contains("illegalstateexception")) {
            return "Your program called a method at a time when the object was not in a valid state for that call. "
                    + "This often means an operation was attempted before the object was properly set up.";
        }

        if (lower.contains("negativearraysizeexception")) {
            return "Your program tried to create an array with a negative size. "
                    + "Array sizes must be zero or a positive number.";
        }

        if (lower.contains("concurrentmodificationexception")) {
            return "Your program modified a collection (like an ArrayList) while iterating over it with a for-each loop. "
                    + "Java collections do not allow structural changes during iteration.";
        }

        if (lower.contains("unsupportedoperationexception")) {
            return "Your program called a method that this collection or object does not support. "
                    + "For example, add() on a fixed-size list created with Arrays.asList.";
        }

        if (lower.contains("inputmismatchexception")) {
            return "Your program read a value with Scanner, but the input was not the expected type "
                    + "(for example, it expected an int and found text).";
        }

        if (lower.contains("nosuchelementexception")) {
            return "Your program asked for the next element of a collection or iterator that has no more elements. "
                    + "This often means the program read past the end of available data.";
        }

        if (lower.contains("filenotfoundexception") || lower.contains("ioexception")) {
            return "Your program tried to work with a file that could not be found or accessed. "
                    + "Check that the file exists and the path is correct (note: CodeVista's sandbox restricts file access).";
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

        if (lower.contains("classcastexception")) {
            return "Check what type the object really is before casting it — use instanceof to test the type first.";
        }

        if (lower.contains("illegalargumentexception")) {
            return "Check the values you pass to the method and make sure they are valid (for example, not negative).";
        }

        if (lower.contains("illegalstateexception")) {
            return "Make sure the object is properly initialized and set up before calling methods on it.";

        }

        if (lower.contains("negativearraysizeexception")) {
            return "Make sure the array size you pass is never negative — check your variable values before creating the array.";
        }

        if (lower.contains("concurrentmodificationexception")) {
            return "Don't add or remove elements from a collection inside a for-each loop. Collect changes and apply them after the loop.";
        }

        if (lower.contains("unsupportedoperationexception")) {
            return "Use a mutable collection (like new ArrayList<>()) if you need to add or remove elements.";
        }

        if (lower.contains("inputmismatchexception")) {
            return "Read the input as text first and parse it yourself, or check the input type matches what Scanner expects.";
        }

        if (lower.contains("nosuchelementexception")) {
            return "Check whether more data exists (for example, with hasNext() or isEmpty()) before reading the next element.";
        }

        if (lower.contains("filenotfoundexception") || lower.contains("ioexception")) {
            return "Verify the file path is correct and the file exists. Note that CodeVista restricts file access for security.";
        }

        return "Check the runtime error and review the values used in your program.";
    }
}