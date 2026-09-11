package com.codevista;

import com.codevista.controller.CompilerController;
import com.codevista.model.CompileRequest;
import com.codevista.model.CompileResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Each new compiler/runtime error category must produce a specific,
 * non-null explanation and fix suggestion (never a blank or generic "we
 * couldn't understand this" response).
 */
@SpringBootTest
class ErrorCategoryTest {

    @Autowired
    private CompilerController controller;

    private CompileResponse compile(String code) {
        return controller.compileCode(new CompileRequest(code));
    }

    private void assertExplained(CompileResponse resp, String... keywords) {
        assertFalse(resp.isSuccess(), "Expected compile failure, got: " + resp.getMessage());
        assertNotNull(resp.getExplanation(), "Should have an explanation");
        assertNotNull(resp.getSuggestion(), "Should have a fix suggestion");
        for (String kw : keywords) {
            assertTrue(resp.getExplanation().toLowerCase().contains(kw.toLowerCase()),
                    "Explanation should mention \"" + kw + "\" but was: " + resp.getExplanation());
        }
    }

    // ── Methods & constructors ──────────────────────────────────────────

    @Test
    void methodArgumentMismatch() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = Math.max(1, 2, 3);\n" +
                "    }\n" +
                "}"), "argument", "method");
    }

    @Test
    void noSuitableMethod() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        \"abc\".substring(1, 2, 3);\n" +
                "    }\n" +
                "}"), "method");
    }

    @Test
    void constructorMismatch() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        String s = new String(42);\n" +
                "    }\n" +
                "}"), "constructor");
    }

    // ── Generics & lambdas ─────────────────────────────────────────────

    @Test
    void genericTypeArgumentOutOfBounds() {
        assertExplained(compile(
                "class Box<T extends Number> { T value; }\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        Box<String> b = new Box<String>();\n" +
                "    }\n" +
                "}"), "type");
    }

    @Test
    void lambdaOnNonFunctionalInterface() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        String s = (int x) -> x;\n" +
                "    }\n" +
                "}"), "lambda", "functional");
    }

    // ── Inheritance & OOP ──────────────────────────────────────────────

    @Test
    void abstractMethodNotImplemented() {
        assertExplained(compile(
                "abstract class Shape { abstract double area(); }\n" +
                "class Circle extends Shape { double radius; }\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        new Circle();\n" +
                "    }\n" +
                "}"), "abstract");
    }

    @Test
    void cannotOverrideFinalMethod() {
        assertExplained(compile(
                "class Base { final void foo() {} }\n" +
                "class Sub extends Base { void foo() {} }\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        new Sub();\n" +
                "    }\n" +
                "}"), "override");
    }

    // ── Scope & statics ────────────────────────────────────────────────

    @Test
    void staticContextReference() {
        assertExplained(compile(
                "public class Main {\n" +
                "    int count = 5;\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(count);\n" +
                "    }\n" +
                "}"), "static");
    }

    @Test
    void variableAlreadyDefined() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = 1;\n" +
                "        int x = 2;\n" +
                "    }\n" +
                "}"), "variable", "defined");
    }

    // ── Classes & packages ─────────────────────────────────────────────

    @Test
    void duplicateClass() {
        assertExplained(compile(
                "class Helper {}\n" +
                "class Helper {}\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {}\n" +
                "}"), "class", "same name");
    }

    @Test
    void publicClassFilenameMismatch() {
        assertExplained(compile(
                "public class NotMain {\n" +
                "    public static void main(String[] args) {}\n" +
                "}"), "Main", "file");
    }

    @Test
    void packageNotFound() {
        assertExplained(compile(
                "import com.nonexistent.Foo;\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {}\n" +
                "}"), "package");
    }

    // ── Control flow ───────────────────────────────────────────────────

    @Test
    void unreachableStatement() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        return;\n" +
                "        System.out.println(\"never\");\n" +
                "    }\n" +
                "}"), "unreachable");
    }

    @Test
    void breakOutsideLoop() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        break;\n" +
                "    }\n" +
                "}"), "break");
    }

    @Test
    void continueOutsideLoop() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        continue;\n" +
                "    }\n" +
                "}"), "continue");
    }

    // ── Exceptions ─────────────────────────────────────────────────────

    @Test
    void unreportedCheckedException() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        Thread.sleep(100);\n" +
                "    }\n" +
                "}"), "exception", "catch");
    }

    // ── Types & operators ──────────────────────────────────────────────

    @Test
    void incomparableTypes() {
        assertExplained(compile(
                "class A {}\n" +
                "class B {}\n" +
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        if (new A() == new B()) {}\n" +
                "    }\n" +
                "}"), "compare");
    }

    @Test
    void badOperandTypes() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = \"a\" % 2;\n" +
                "    }\n" +
                "}"), "operand");
    }

    // ── Arrays ─────────────────────────────────────────────────────────

    @Test
    void arrayDimensionMissing() {
        assertExplained(compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int[] arr = new int[];\n" +
                "    }\n" +
                "}"), "array", "size");
    }

    // ── Runtime exceptions ─────────────────────────────────────────────

    @Test
    void classCastExceptionExplained() {
        CompileResponse resp = compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        Object o = new Object();\n" +
                "        String s = (String) o;\n" +
                "    }\n" +
                "}"
        );
        assertFalse(resp.isSuccess());
        assertTrue(resp.getError().startsWith("Runtime Error:"),
                "Should be flagged as a runtime error");
        assertNotNull(resp.getExplanation());
        assertTrue(resp.getExplanation().toLowerCase().contains("cast"));
    }

    @Test
    void illegalArgumentExplained() {
        CompileResponse resp = compile(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        java.util.ArrayList<String> list = new java.util.ArrayList<>(-1);\n" +
                "    }\n" +
                "}"
        );
        assertFalse(resp.isSuccess());
        assertTrue(resp.getError().startsWith("Runtime Error:"));
        assertNotNull(resp.getExplanation());
        assertTrue(resp.getExplanation().toLowerCase().contains("invalid")
                        || resp.getExplanation().toLowerCase().contains("value"));
    }
}