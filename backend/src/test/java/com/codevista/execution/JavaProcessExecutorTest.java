package com.codevista.execution;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.intelligence.explainer.DefaultFallbackExplainer;
import com.codevista.compiler.intelligence.explainer.SemicolonExpectedExplainer;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.Language;
import com.codevista.execution.adapter.JavaProcessExecutor;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.execution.model.ExecutionResult;
import com.codevista.execution.model.ExecutionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JavaProcessExecutorTest {

    private JavaProcessExecutor executor;

    @BeforeEach
    void setUp() {
        JavaCompilerAdapter compilerAdapter = new JavaCompilerAdapter();
        ErrorIntelligenceService errorService = new ErrorIntelligenceService(List.of(
                new SemicolonExpectedExplainer(),
                new DefaultFallbackExplainer()
        ));
        this.executor = new JavaProcessExecutor(compilerAdapter, errorService);
    }

    @Test
    @DisplayName("1. Normal program executes and captures stdout")
    void testNormalProgramExecution() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        System.out.println("Hello, CodeVista AI!");
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.SUCCESS);
        assertThat(result.getOutput().trim()).isEqualTo("Hello, CodeVista AI!");
        assertThat(result.getRuntimeError()).isEmpty();
        assertThat(result.getExitCode()).isEqualTo(0);
        assertThat(result.getExecutionTimeMs()).isGreaterThan(0);
    }

    @Test
    @DisplayName("2. Program reading standard input executes correctly")
    void testProgramWithStandardInput() {
        String code = """
                import java.util.Scanner;

                public class Main {
                    public static void main(String[] args) {
                        Scanner scanner = new Scanner(System.in);
                        String name = scanner.nextLine();
                        int age = scanner.nextInt();
                        System.out.println("User: " + name + ", Age: " + age);
                    }
                }
                """;

        String input = "Alice\n25\n";
        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, input));

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.SUCCESS);
        assertThat(result.getOutput().trim()).isEqualTo("User: Alice, Age: 25");
        assertThat(result.getExitCode()).isEqualTo(0);
    }

    @Test
    @DisplayName("3. Runtime exception (divide by zero) is captured in runtimeError")
    void testRuntimeExceptionArithmeticException() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int a = 10;
                        int b = 0;
                        System.out.println(a / b);
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RUNTIME_ERROR);
        assertThat(result.getRuntimeError()).contains("ArithmeticException");
        assertThat(result.getExitCode()).isNotEqualTo(0);
    }

    @Test
    @DisplayName("4. Runtime exception (ArrayIndexOutOfBounds) is captured in runtimeError")
    void testRuntimeExceptionArrayIndexOutOfBounds() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int[] arr = new int[2];
                        System.out.println(arr[5]);
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RUNTIME_ERROR);
        assertThat(result.getRuntimeError()).contains("ArrayIndexOutOfBoundsException");
    }

    @Test
    @DisplayName("5. Infinite loop is terminated cleanly by timeout")
    void testInfiniteLoopTimesOut() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        while (true) {
                            // Infinite loop
                        }
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.TIMEOUT);
        assertThat(result.getRuntimeError()).contains("timed out");
    }

    @Test
    @DisplayName("6. Huge output exceeding limit is truncated with OUTPUT_LIMIT_EXCEEDED")
    void testHugeOutputExceedsLimit() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        for (int i = 0; i < 20000; i++) {
                            System.out.println("Excessive output line " + i + " to flood the stdout stream");
                        }
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.OUTPUT_LIMIT_EXCEEDED);
        assertThat(result.getOutput().length()).isLessThanOrEqualTo(105000);
        assertThat(result.getRuntimeError()).contains("Standard output limit exceeded");
    }

    @Test
    @DisplayName("7. Compilation error during execution returns COMPILATION_ERROR with diagnostics")
    void testCompilationFailureDuringExecution() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int a = 5
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.COMPILATION_ERROR);
        assertThat(result.getDiagnostics()).isNotEmpty();
        assertThat(result.getDiagnostics().get(0).getExplanation()).isNotNull();
    }

    @Test
    @DisplayName("8. Host secrets and environment variables are stripped and unreadable")
    void testSecuritySecretsIsolation() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        String secret1 = System.getenv("SPRING_DATASOURCE_URL");
                        String secret2 = System.getenv("DB_PASSWORD");
                        System.out.println("SECRET1=" + secret1);
                        System.out.println("SECRET2=" + secret2);
                    }
                }
                """;

        ExecutionResult result = executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getOutput()).contains("SECRET1=null");
        assertThat(result.getOutput()).contains("SECRET2=null");
    }

    @Test
    @DisplayName("9. Temporary sandbox directories are deleted after execution")
    void testSandboxCleanup() {
        File tempDir = new File(System.getProperty("java.io.tmpdir"));
        long initialCodevistaDirs = countExecDirs(tempDir);

        String code = """
                public class Main {
                    public static void main(String[] args) {
                        System.out.println("Testing cleanup");
                    }
                }
                """;

        executor.execute(new ExecutionRequest(Language.JAVA, code, ""));

        long afterExecutionDirs = countExecDirs(tempDir);
        assertThat(afterExecutionDirs).isEqualTo(initialCodevistaDirs);
    }

    private long countExecDirs(File dir) {
        File[] files = dir.listFiles((d, name) -> name.startsWith("codevista_exec_"));
        return files != null ? files.length : 0;
    }
}
