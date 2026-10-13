package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.adapter.JavaCompilerAdapter;
import com.codevista.compiler.pipeline.model.BytecodeInstructionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JavaBytecodeDisassemblerServiceTest {

    private JavaBytecodeDisassemblerService disassemblerService;

    @BeforeEach
    void setUp() {
        JavaCompilerAdapter adapter = new JavaCompilerAdapter();
        disassemblerService = new JavaBytecodeDisassemblerService(adapter);
    }

    @Test
    void testDisassembleValidJavaCode() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int x = 42;
                        System.out.println(x);
                    }
                }
                """;

        JavaBytecodeDisassemblerService.DisassemblyResult result = disassemblerService.disassemble(code, "Main");
        assertNotNull(result);
        assertTrue(result.success(), "Disassembly should succeed for valid Java code. Error: " + result.error());
        assertFalse(result.instructions().isEmpty(), "Instructions should not be empty");
        assertNotNull(result.rawOutput(), "Raw javap output should be present");

        // Verify key opcodes exist: bipush (or similar integer load), getstatic, return
        boolean hasStore = result.instructions().stream().anyMatch(i -> i.opcode().startsWith("istore"));
        boolean hasReturn = result.instructions().stream().anyMatch(i -> i.opcode().equals("return"));
        boolean hasPrint = result.instructions().stream().anyMatch(i -> i.opcode().contains("invoke"));

        assertTrue(hasStore, "Bytecode should contain istore opcode");
        assertTrue(hasReturn, "Bytecode should contain return opcode");
        assertTrue(hasPrint, "Bytecode should contain invoke opcode");

        // Verify LineNumberTable correlation: line numbers should be >= 1
        for (BytecodeInstructionDto inst : result.instructions()) {
            assertTrue(inst.line() >= 1, "Instruction line should be valid");
            assertNotNull(inst.explanation(), "Instruction explanation should be present");
        }
    }
}
