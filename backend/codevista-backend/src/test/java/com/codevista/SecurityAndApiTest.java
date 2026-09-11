package com.codevista;

import com.codevista.controller.CompilerController;
import com.codevista.model.CompileRequest;
import com.codevista.model.CompileResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Security / resilience tests. Timeouts are shortened via test properties so
 * runaway-program tests complete quickly — the important assertion is that
 * the call <em>returns</em> (i.e. the server thread does not hang forever,
 * which was a real bug) with a sane error.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "codevista.execution.timeout-seconds=4",
        "codevista.compilation.timeout-seconds=5",
        "codevista.execution.max-code-length=2000",
        "codevista.history.max-entries=50",
})
class SecurityAndApiTest {

    @Autowired
    private CompilerController controller;

    // ── Malicious / runaway code ──────────────────────────────────────

    @Test
    void infiniteLoopWithNoOutputMustTerminate() {
        // Before the fix, this blocked the server thread forever: output was
        // read to EOF before the timeout was ever checked.
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        while (true) {\n" +
                "        }\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess(), "Infinite loop must not succeed");
        assertTrue(resp.getMessage().contains("timed out")
                        || resp.getMessage().contains("Runtime error"),
                "Should report a timeout, got: " + resp.getMessage());
    }

    @Test
    void infiniteLoopWithOutputMustTerminateAndCapOutput() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        while (true) {\n" +
                "            System.out.println(\"x\");\n" +
                "        }\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess(), "Infinite loop must not succeed");
        assertTrue(resp.getMessage().contains("timed out")
                        || resp.getMessage().contains("Runtime error"),
                "Should report a timeout, got: " + resp.getMessage());
        // Output must be bounded even though the program runs forever.
        assertNotNull(resp.getOutput());
        assertTrue(resp.getOutput().length() <= 132000,
                "Captured output must be capped, was " + resp.getOutput().length());
    }

    @Test
    void largeOutputIsTruncatedButProgramStillSucceeds() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        for (int i = 0; i < 50000; i++) {\n" +
                "            System.out.println(i);\n" +
                "        }\n" +
                "    }\n" +
                "}"
        ));

        assertTrue(resp.isSuccess(), "A large-but-finite program should succeed");
        assertNotNull(resp.getOutput());
        assertTrue(resp.getOutput().contains("truncated"),
                "Huge output should be marked as truncated");
        assertTrue(resp.getOutput().length() < 50000 * 5,
                "Output should not contain all 50k lines");
    }

    @Test
    void excessiveSourceCodeIsRejected() {
        StringBuilder huge = new StringBuilder("public class Main { public static void main(String[] a) { ");
        for (int i = 0; i < 300; i++) {
            huge.append("int x").append(i).append(" = ").append(i).append("; ");
        }
        huge.append("} }");

        CompileResponse resp = controller.compileCode(new CompileRequest(huge.toString()));
        assertFalse(resp.isSuccess());
        assertTrue(resp.getMessage().toLowerCase().contains("too large"));
    }

    // ── API contract ──────────────────────────────────────────────────

    @Test
    void unsupportedLanguageIsRejected() {
        CompileResponse resp = controller.compileCode(
                new CompileRequest("public class Main {}", "python"));
        assertFalse(resp.isSuccess());
        assertTrue(resp.getMessage().toLowerCase().contains("unsupported language"));
    }

    @Test
    void javaLanguageIsAccepted() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        System.out.println(\"ok\");\n" +
                "    }\n" +
                "}",
                "java"
        ));
        assertTrue(resp.isSuccess(), "Explicit java language should work");
        assertEquals("ok", resp.getOutput());
    }

    @Test
    void runtimeErrorReportsSourceLine() {
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        int x = 10 / 0;\n" +
                "    }\n" +
                "}"
        ));

        assertFalse(resp.isSuccess());
        assertTrue(resp.getError().startsWith("Runtime Error:"),
                "Should be flagged as a runtime error");
        assertEquals(3, resp.getLineNumber(),
                "Runtime error should point at the failing line");
    }

    @Test
    void fileAccessAttemptDoesNotCrashServer() {
        // Even though this environment does not fully sandbox the filesystem,
        // the request must be handled and the server must keep running.
        CompileResponse resp = controller.compileCode(new CompileRequest(
                "public class Main {\n" +
                "    public static void main(String[] args) {\n" +
                "        java.io.File f = new java.io.File(\"C:/Windows/System32/config\");\n" +
                "        System.out.println(f.exists());\n" +
                "    }\n" +
                "}"
        ));

        // Compiles and runs either way — what matters is no crash/hang.
        assertNotNull(resp);
        assertTrue(resp.isSuccess() || resp.getError() != null);
    }

    @Test
    void healthEndpointReportsOk() {
        var health = controller.health();
        assertEquals("ok", health.get("status"));
        assertEquals("codevista-backend", health.get("service"));
        assertNotNull(health.get("javaVersion"));
    }

    @Test
    void historyRecordsRuns() {
        controller.compileCode(new CompileRequest(
                "public class Main { public static void main(String[] a) { System.out.println(1); } }"
        ));
        controller.compileCode(new CompileRequest(
                "public class Main { public static void main(String[] a) { System.out.println(2); } }"
        ));

        var entries = controller.history();
        assertFalse(entries.isEmpty(), "History should not be empty after runs");
        assertEquals("java", entries.get(0).language());
        assertNotNull(entries.get(0).timestamp());
        assertTrue(entries.get(0).id() > 0);
        assertTrue(entries.size() >= 2);
    }
}