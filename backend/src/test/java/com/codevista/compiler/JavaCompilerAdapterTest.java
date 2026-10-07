package com.codevista.compiler;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.model.CompilationRequest;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.model.Language;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JavaCompilerAdapterTest {

    private JavaCompilerAdapter compiler;

    @BeforeEach
    void setUp() {
        compiler = new JavaCompilerAdapter();
    }

    @Test
    @DisplayName("1. Valid Java program compiles successfully with zero diagnostics")
    void testValidJavaProgram() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        System.out.println("Hello, CodeVista AI!");
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getCompilerStatus()).isEqualTo("SUCCESS");
        assertThat(result.getDiagnostics()).isEmpty();
        assertThat(result.getMainClass()).isEqualTo("Main");
        assertThat(result.getCompilationTimeMs()).isGreaterThan(0);
    }

    @Test
    @DisplayName("2. Missing semicolon generates accurate compiler diagnostic")
    void testMissingSemicolon() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int count = 10
                        System.out.println(count);
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).containsIgnoringCase("';' expected");
        assertThat(result.getDiagnostics().get(0).getLine()).isGreaterThan(0);
    }

    @Test
    @DisplayName("3. Missing closing bracket generates diagnostic")
    void testMissingBracket() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        if (true) {
                            System.out.println("Missing closing bracket");
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).containsAnyOf("reached end of file while parsing", "'}' expected");
    }

    @Test
    @DisplayName("4. Unknown variable reference produces cannot find symbol error")
    void testUnknownVariable() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        System.out.println(undeclaredVar);
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).contains("cannot find symbol");
        assertThat(result.getDiagnostics().get(0).getMessage()).contains("undeclaredVar");
    }

    @Test
    @DisplayName("5. Incompatible types error detected with type names")
    void testIncompatibleTypes() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int number = "not an int";
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).containsAnyOf("incompatible types", "cannot be converted to");
    }

    @Test
    @DisplayName("6. Invalid method call produces cannot find symbol error")
    void testInvalidMethod() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        String text = "hello";
                        text.thisMethodDoesNotExist();
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).contains("cannot find symbol");
        assertThat(result.getDiagnostics().get(0).getMessage()).contains("thisMethodDoesNotExist");
    }

    @Test
    @DisplayName("7. Invalid constructor invocation produces constructor mismatch error")
    void testInvalidConstructor() {
        String code = """
                public class Main {
                    public Main(int a, int b) {}
                    public static void main(String[] args) {
                        Main m = new Main("wrong", "types");
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).containsAnyOf("cannot be applied", "incompatible types", "no suitable constructor");
    }

    @Test
    @DisplayName("8. Missing return statement in non-void method produces missing return error")
    void testMissingReturn() {
        String code = """
                public class Main {
                    public static int calculate() {
                        int a = 1;
                        int b = 2;
                    }
                    public static void main(String[] args) {
                        calculate();
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).contains("missing return statement");
    }

    @Test
    @DisplayName("9. Static context accessing non-static field produces static reference error")
    void testStaticNonStaticError() {
        String code = """
                public class Main {
                    int instanceField = 42;
                    public static void main(String[] args) {
                        System.out.println(instanceField);
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).contains("non-static variable instanceField cannot be referenced from a static context");
    }

    @Test
    @DisplayName("10. Invalid package declaration produces syntax error")
    void testInvalidPackage() {
        String code = """
                package 123invalid.package;
                public class Main {
                    public static void main(String[] args) {
                        System.out.println("Invalid package");
                    }
                }
                """;

        CompilationResult result = compiler.compile(new CompilationRequest(Language.JAVA, code));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getCompilerStatus()).isEqualTo("ERROR");
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getMessage()).containsAnyOf("expected", "invalid");
    }
}
