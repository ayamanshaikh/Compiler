package com.codevista.trace;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.intelligence.explainer.DefaultFallbackExplainer;
import com.codevista.compiler.intelligence.explainer.SemicolonExpectedExplainer;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.Language;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.execution.model.ExecutionStatus;
import com.codevista.trace.adapter.JavaTraceExecutor;
import com.codevista.trace.instrumenter.JavaSourceInstrumenter;
import com.codevista.trace.model.ExecutionTrace;
import com.codevista.trace.model.TraceStep;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JavaTraceExecutorTest {

    private JavaTraceExecutor executor;

    @BeforeEach
    void setUp() {
        JavaCompilerAdapter compilerAdapter = new JavaCompilerAdapter();
        ErrorIntelligenceService errorService = new ErrorIntelligenceService(List.of(
                new SemicolonExpectedExplainer(),
                new DefaultFallbackExplainer()
        ));
        JavaSourceInstrumenter instrumenter = new JavaSourceInstrumenter();
        this.executor = new JavaTraceExecutor(compilerAdapter, errorService, instrumenter);
    }

    @Test
    @DisplayName("1. Real Java program execution generates authentic trace steps with variables and outputs")
    void testAuthenticExecutionTracing() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int a = 10;
                        int b = 25;
                        int sum = a + b;
                        System.out.println("Result: " + sum);
                    }
                }
                """;

        ExecutionTrace trace = executor.trace(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(trace.isSuccess()).isTrue();
        assertThat(trace.getStatus()).isEqualTo(ExecutionStatus.SUCCESS);
        assertThat(trace.getTotalSteps()).isGreaterThan(0);
        assertThat(trace.getFinalOutput()).contains("Result: 35");

        // Verify variable values computed by the JVM
        boolean foundSum = false;
        for (TraceStep step : trace.getSteps()) {
            if (step.getVariables().containsKey("sum")) {
                assertThat(step.getVariables().get("sum").getValue()).isEqualTo("35");
                foundSum = true;
            }
        }
        assertThat(foundSum).isTrue();
    }

    @Test
    @DisplayName("2. Array operations are captured in heap state during execution")
    void testArrayTracing() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int[] nums = new int[2];
                        nums[0] = 42;
                        nums[1] = 84;
                    }
                }
                """;

        ExecutionTrace trace = executor.trace(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(trace.isSuccess()).isTrue();
        boolean foundArrayElement = false;
        for (TraceStep step : trace.getSteps()) {
            if (step.getHeapObjects().containsKey("nums[0]")) {
                assertThat(step.getHeapObjects().get("nums[0]").getState().get("value")).isEqualTo("42");
                foundArrayElement = true;
            }
        }
        assertThat(foundArrayElement).isTrue();
    }

    @Test
    @DisplayName("3. Loop iterations generate sequential step records")
    void testLoopTracing() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int count = 0;
                        for (int i = 0; i < 3; i++) {
                            count += 2;
                        }
                    }
                }
                """;

        ExecutionTrace trace = executor.trace(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(trace.isSuccess()).isTrue();
        assertThat(trace.getTotalSteps()).isGreaterThan(3);

        // Verify the final recorded value of count is 6
        TraceStep lastStep = trace.getSteps().get(trace.getSteps().size() - 1);
        assertThat(lastStep.getVariables().get("count").getValue()).isEqualTo("6");
    }

    @Test
    @DisplayName("4. Compilation failure during trace returns COMPILATION_ERROR with diagnostics")
    void testTraceCompilationFailure() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int broken = 10
                    }
                }
                """;

        ExecutionTrace trace = executor.trace(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(trace.isSuccess()).isFalse();
        assertThat(trace.getStatus()).isEqualTo(ExecutionStatus.COMPILATION_ERROR);
        assertThat(trace.getDiagnostics()).isNotEmpty();
    }

    @Test
    @DisplayName("5. Infinite loop cleanly terminates within timeout")
    void testTraceInfiniteLoopTimeout() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        while (true) {
                        }
                    }
                }
                """;

        ExecutionTrace trace = executor.trace(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(trace.isSuccess()).isFalse();
        assertThat(trace.getStatus()).isEqualTo(ExecutionStatus.TIMEOUT);
    }

    @Test
    @DisplayName("6. Trace steps carry normalized contract fields (symbol, operation, currentValue, scope)")
    void testNormalizedExecutionContractFields() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int x = 10;
                        x = 20;
                        System.out.println("x=" + x);
                    }
                }
                """;

        ExecutionTrace trace = executor.trace(new ExecutionRequest(Language.JAVA, code, ""));

        assertThat(trace.isSuccess()).isTrue();
        assertThat(trace.getSteps()).isNotEmpty();

        boolean foundDeclaration = false;
        boolean foundAssignment = false;
        boolean foundPrint = false;

        for (TraceStep step : trace.getSteps()) {
            if ("x".equals(step.getSymbol()) && "DECLARE".equals(step.getOperation())) {
                assertThat(step.getCurrentValue()).isEqualTo("10");
                assertThat(step.getScope()).isEqualTo("main");
                foundDeclaration = true;
            }
            if ("x".equals(step.getSymbol()) && "ASSIGN".equals(step.getOperation())) {
                assertThat(step.getPreviousValue()).isEqualTo("10");
                assertThat(step.getCurrentValue()).isEqualTo("20");
                foundAssignment = true;
            }
            if ("PRINT".equals(step.getOperation())) {
                assertThat(step.getCurrentValue()).contains("x=20");
                foundPrint = true;
            }
        }

        assertThat(foundDeclaration).isTrue();
        assertThat(foundAssignment).isTrue();
        assertThat(foundPrint).isTrue();
    }
}
