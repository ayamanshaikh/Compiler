package com.codevista.trace;

import com.codevista.trace.instrumenter.JavaSourceInstrumenter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JavaSourceInstrumenterTest {

    private JavaSourceInstrumenter instrumenter;

    @BeforeEach
    void setUp() {
        this.instrumenter = new JavaSourceInstrumenter();
    }

    @Test
    @DisplayName("JavaSourceInstrumenter inserts collector import and main method hook")
    void shouldInsertImportAndMainHook() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        System.out.println("Hello");
                    }
                }
                """;

        String result = instrumenter.instrument(code);

        assertThat(result).contains("import com.codevista.runtime.CodeVistaTraceCollector;");
        assertThat(result).contains("CodeVistaTraceCollector.registerHook();");
        assertThat(result).contains("CodeVistaTraceCollector.line(2, \"Entered main method\");");
    }

    @Test
    @DisplayName("JavaSourceInstrumenter captures variable declaration and assignments")
    void shouldInstrumentVariableDeclarationsAndAssignments() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int x = 10;
                        x = 25;
                        x++;
                    }
                }
                """;

        String result = instrumenter.instrument(code);

        assertThat(result).contains("CodeVistaTraceCollector.var(\"x\", \"int\", String.valueOf(x), 3);");
        assertThat(result).contains("CodeVistaTraceCollector.var(\"x\", \"var\", String.valueOf(x), 4);");
        assertThat(result).contains("CodeVistaTraceCollector.var(\"x\", \"var\", String.valueOf(x), 5);");
    }

    @Test
    @DisplayName("JavaSourceInstrumenter captures array modifications")
    void shouldInstrumentArrayMutations() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int[] nums = new int[3];
                        nums[0] = 99;
                    }
                }
                """;

        String result = instrumenter.instrument(code);

        assertThat(result).contains("CodeVistaTraceCollector.arrayMutate(\"nums\", (int)(0), String.valueOf(nums[0]), 4);");
    }

    @Test
    @DisplayName("JavaSourceInstrumenter avoids injecting statement hooks at class scope fields")
    void shouldNotInstrumentClassScopeFields() {
        String code = """
                public class Main {
                    static class Student {
                        String name;
                        int score;

                        Student(String name, int score) {
                            this.name = name;
                            this.score = score;
                        }
                    }

                    public static void main(String[] args) {
                        Student s = new Student("Alex", 95);
                    }
                }
                """;

        String result = instrumenter.instrument(code);

        // Fields must remain clean
        assertThat(result).doesNotContain("CodeVistaTraceCollector.line(4, \"Executed line 4\");");
        assertThat(result).doesNotContain("CodeVistaTraceCollector.line(5, \"Executed line 5\");");
        // Main should still be instrumented
        assertThat(result).contains("CodeVistaTraceCollector.var(\"s\", \"Student\", String.valueOf(s), 13);");
    }
}
