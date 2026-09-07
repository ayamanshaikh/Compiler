package com.codevista;

import com.codevista.model.CompileRequest;
import com.codevista.model.CompileResponse;
import com.codevista.controller.CompilerController;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CompilerControllerTest {

    @Autowired
    private CompilerController controller;

    // ── Valid programs ──────────────────────────────────────────────

    @Test
    void validHelloWorld() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"Hello CodeVista!\");\n" +
                "    }\n" +
                "}"
        ));

        assertTrue(resp.isSuccess(), "Should compile successfully");
        assertEquals("Hello CodeVista!", resp.getOutput());
        assertNotNull(resp.getExecutionSteps());
    }

    @Test
    void validBubbleSort() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int[] arr = {5, 3, 8, 1};\n" +
                "        for (int i = 0; i < arr.length - 1; i++) {\n" +
                "            for (int j = 0; j < arr.length - i - 1; j++) {\n" +
                "                if (arr[j] > arr[j + 1]) {\n" +
                "                    int temp = arr[j];\n" +
                "                    arr[j] = arr[j + 1];\n" +
                "                    arr[j + 1] = temp;\n" +
                "                }\n" +
                "            }\n" +
                "        }\n" +
                "        System.out.println(\"Sorted!\");\n" +
                "    }\n" +
                "}"
        ));

        assertTrue(resp.isSuccess(), "Bubble sort should compile and run");
        assertTrue(resp.getOutput().contains("Sorted!"));
        // The JDI tracer should have captured some steps
        assertTrue(resp.getExecutionSteps().size() > 0,
                "Execution trace should have steps");
    }

    // ── Syntax errors ───────────────────────────────────────────────

    @Test
    void missingSemicolon() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"Hello\")\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess(), "Should fail to compile");
        assertEquals(3, resp.getLineNumber(), "Error should be on line 3");
        assertNotNull(resp.getExplanation(), "Should have explanation");
        assertNotNull(resp.getSuggestion(), "Should have suggestion");
        assertTrue(resp.getExplanation().toLowerCase().contains("semicolon"),
                "Explanation should mention semicolons");
    }

    @Test
    void cannotFindSymbol() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(unknownVar);\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess());
        assertNotNull(resp.getExplanation());
        assertNotNull(resp.getSuggestion());
    }

    @Test
    void incompatibleTypes() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = \"hello\";\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess());
        assertNotNull(resp.getExplanation());
    }

    @Test
    void missingClosingBrace() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"test\");\n"
        ));

        assertFalse(resp.isSuccess());
        assertNotNull(resp.getExplanation());
    }

    // ── Runtime errors ──────────────────────────────────────────────

    @Test
    void arithmeticException() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = 10 / 0;\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess(), "Should fail at runtime");
        assertNotNull(resp.getError());
        assertNotNull(resp.getExplanation());
        assertTrue(resp.getError().contains("Runtime Error"),
                "Should indicate runtime error");
    }

    @Test
    void arrayIndexOutOfBounds() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int[] arr = {1, 2, 3};\n" +
                "        System.out.println(arr[10]);\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess());
        assertNotNull(resp.getExplanation());
        assertTrue(resp.getExplanation().toLowerCase().contains("array"),
                "Explanation should mention arrays");
    }

    @Test
    void nullPointer() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        String s = null;\n" +
                "        System.out.println(s.length());\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess());
        assertNotNull(resp.getExplanation());
        assertTrue(resp.getExplanation().toLowerCase().contains("null"),
                "Explanation should mention null");
    }

    // ── Edge cases ──────────────────────────────────────────────────

    @Test
    void emptyCode() {
        CompileResponse resp = controller.compileCode(new CompileRequest(""));
        assertFalse(resp.isSuccess());
        assertEquals(0, resp.getLineNumber());
    }

    @Test
    void nullCode() {
        CompileResponse resp = controller.compileCode(new CompileRequest(null));
        assertFalse(resp.isSuccess());
        assertEquals(0, resp.getLineNumber());
    }

    @Test
    void whitespaceOnly() {
        CompileResponse resp = controller.compileCode(new CompileRequest("   \n  \n  "));
        assertFalse(resp.isSuccess());
    }

    @Test
    void outputIsCaptured() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        for (int i = 0; i < 5; i++) {\n" +
                "            System.out.println(i);\n" +
                "        }\n" +
                "    }\n" +
                "}"
        ));

        assertTrue(resp.isSuccess());
        assertNotNull(resp.getOutput());
        assertTrue(resp.getOutput().contains("0"));
        assertTrue(resp.getOutput().contains("4"));
    }

    @Test
    void executionStepsHaveValidStructure() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = 10;\n" +
                "        int y = 20;\n" +
                "        int z = x + y;\n" +
                "        System.out.println(z);\n" +
                "    }\n" +
                "}"
        ));

        assertTrue(resp.isSuccess());
        assertNotNull(resp.getExecutionSteps());

        if (!resp.getExecutionSteps().isEmpty()) {
            var first = resp.getExecutionSteps().get(0);
            assertTrue(first.getStep() > 0, "Step number should be positive");
            assertTrue(first.getLineNumber() > 0, "Line number should be positive");
            assertNotNull(first.getCode(), "Code should not be null");
            assertNotNull(first.getAction(), "Action should not be null");
            assertNotNull(first.getExplanation(), "Explanation should not be null");
        }
    }
}
