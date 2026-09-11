package com.codevista;

import com.codevista.controller.CompilerController;
import com.codevista.model.CompileRequest;
import com.codevista.model.CompileResponse;
import com.codevista.model.ExecutionStep;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests that the JDI tracer captures rich state for programs beyond the
 * classic int[] bubble sort: typed arrays, scalar comparisons, recursion
 * depth, helper classes, and user-object fields.
 */
@SpringBootTest
class VisualizationBreadthTest {

    @Autowired
    private CompilerController controller;

    private CompileResponse run(String code) {
        return controller.compileCode(new CompileRequest(code));
    }

    @Test
    void doubleArrayProducesTypedArrays() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        double[] d = {1.5, 2.5, 3.5};\n" +
                "        System.out.println(d.length);\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        assertFalse(resp.getExecutionSteps().isEmpty());
        ExecutionStep step = resp.getExecutionSteps().stream()
                .filter(s -> s.getTypedArrays() != null
                        && s.getTypedArrays().containsKey("d"))
                .findFirst()
                .orElse(null);
        assertNotNull(step, "double[] should appear in typedArrays of some step");
        assertEquals("double", step.getTypedArrays().get("d").getType());
        assertEquals(3, step.getTypedArrays().get("d").getValues().size());
        assertEquals("1.5", step.getTypedArrays().get("d").getValues().get(0));
    }

    @Test
    void stringArrayProducesTypedArrays() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        String[] names = {\"ana\", \"bob\", \"cat\"};\n" +
                "        System.out.println(names.length);\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        assertFalse(resp.getExecutionSteps().isEmpty());
        ExecutionStep step = resp.getExecutionSteps().stream()
                .filter(s -> s.getTypedArrays() != null
                        && s.getTypedArrays().containsKey("names"))
                .findFirst()
                .orElse(null);
        assertNotNull(step, "String[] should appear in typedArrays of some step");
        assertEquals("String", step.getTypedArrays().get("names").getType());
        assertEquals(3, step.getTypedArrays().get("names").getValues().size());
    }

    @Test
    void stringArrayMutationProducesSteps() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        String[] names = {\"a\", \"b\"};\n" +
                "        names[0] = \"z\";\n" +
                "        System.out.println(names[0]);\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        assertFalse(resp.getExecutionSteps().isEmpty());
        assertTrue(resp.getExecutionSteps().size() >= 2,
                "String[] mutation should yield multiple steps, got "
                        + resp.getExecutionSteps().size());
    }

    @Test
    void scalarComparisonAttachesValues() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int a = 5;\n" +
                "        int b = 3;\n" +
                "        if (a > b) {\n" +
                "            System.out.println(\"bigger\");\n" +
                "        }\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        ExecutionStep cmp = null;
        for (ExecutionStep s : resp.getExecutionSteps()) {
            if (s.getComparison() != null
                    && ">".equals(s.getComparison().getOperator())) {
                cmp = s;
                break;
            }
        }
        assertNotNull(cmp, "Should capture a scalar > comparison");
        assertEquals(5, cmp.getComparison().getLeft());
        assertEquals(3, cmp.getComparison().getRight());
        assertTrue(cmp.getComparison().isResult());
    }

    @Test
    void scalarComparisonWithLiteral() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int count = 10;\n" +
                "        if (count >= 10) {\n" +
                "            System.out.println(\"ok\");\n" +
                "        }\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        boolean saw = resp.getExecutionSteps().stream()
                .anyMatch(s -> s.getComparison() != null
                        && s.getComparison().getLeft() == 10
                        && s.getComparison().getRight() == 10);
        assertTrue(saw, "count >= 10 comparison should evaluate 10 >= 10");
    }

    @Test
    void recursionShowsCallDepth() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static int factorial(int n) {\n" +
                "        if (n <= 1) {\n" +
                "            return 1;\n" +
                "        }\n" +
                "        return n * factorial(n - 1);\n" +
                "    }\n" +
                "\n" +
                "    public static void main(String[] args) {\n" +
                "        int result = factorial(4);\n" +
                "        System.out.println(result);\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        assertFalse(resp.getExecutionSteps().isEmpty());
        boolean sawDepth = resp.getExecutionSteps().stream()
                .anyMatch(s -> s.getCallDepth() >= 2);
        assertTrue(sawDepth, "Recursion should produce steps with callDepth >= 2");
    }

    @Test
    void helperClassMethodsAreTraced() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = Util.doubleIt(21);\n" +
                "        System.out.println(x);\n" +
                "    }\n" +
                "}\n" +
                "\n" +
                "class Util {\n" +
                "    static int doubleIt(int v) {\n" +
                "        int doubled = v * 2;\n" +
                "        return doubled;\n" +
                "    }\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        assertFalse(resp.getExecutionSteps().isEmpty());
        boolean sawHelper = resp.getExecutionSteps().stream()
                .anyMatch(s -> s.getCode() != null && s.getCode().contains("int doubled"));
        assertTrue(sawHelper, "Helper class method body should appear in the trace");
    }

    @Test
    void userObjectFieldsAreIntrospected() {
        CompileResponse resp = run(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        Student s = new Student();\n" +
                "        s.name = \"ada\";\n" +
                "        s.age = 20;\n" +
                "        System.out.println(s.name);\n" +
                "    }\n" +
                "}\n" +
                "\n" +
                "class Student {\n" +
                "    String name;\n" +
                "    int age;\n" +
                "}"
        );
        assertTrue(resp.isSuccess(), resp.getMessage());
        boolean sawField = resp.getExecutionSteps().stream()
                .anyMatch(s -> s.getVariables().containsKey("s.name")
                        || s.getVariables().containsKey("s.age"));
        assertTrue(sawField, "Object fields should appear as obj.field in variables");
    }
}