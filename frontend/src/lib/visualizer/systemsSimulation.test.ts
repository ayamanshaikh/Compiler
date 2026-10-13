import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLocalVariableSlots,
  simulateOperandStack,
  simulateAluOperation,
  buildHeapMemoryBlocks,
  buildConceptualRegisters,
  generateSystemsSimulation,
} from "./systemsSimulation";
import { TraceResponsePayload, TraceStep, BytecodeInstruction } from "../api/types";

describe("Hardware & Computer Systems Simulation Engine", () => {
  it("buildLocalVariableSlots maps slot 0 and sorted local variables", () => {
    const vars = {
      price: { name: "price", type: "int", value: "100" },
      quantity: { name: "quantity", type: "int", value: "3" },
    };

    const slots = buildLocalVariableSlots(vars, true);
    assert.equal(slots.length, 3);
    assert.equal(slots[0].slot, 0);
    assert.equal(slots[0].name, "args");
    assert.equal(slots[1].slot, 1);
    assert.equal(slots[1].name, "price");
    assert.equal(slots[1].value, "100");
    assert.equal(slots[2].slot, 2);
    assert.equal(slots[2].name, "quantity");
    assert.equal(slots[2].value, "3");
  });

  it("simulateOperandStack pushes evaluated value and sets isTop", () => {
    const step: TraceStep = {
      stepIndex: 1,
      line: 3,
      eventType: "VARIABLE_ASSIGNMENT",
      description: "Assigned total = 300",
      symbol: "total",
      currentValue: "300",
      variables: {},
      callStack: [],
      heapObjects: {},
      output: "",
    };

    const matchingInst: BytecodeInstruction = {
      offset: 4,
      opcode: "imul",
      arguments: "",
      line: 3,
      explanation: "Multiply two integers",
      methodName: "main",
    };

    const stack = simulateOperandStack(step, matchingInst);
    assert.equal(stack.length, 1);
    assert.equal(stack[0].value, "300");
    assert.equal(stack[0].type, "int");
    assert.equal(stack[0].isTop, true);
    assert.equal(stack[0].sourceOpcode, "imul");
  });

  it("simulateAluOperation computes integer addition and flags", () => {
    const step: TraceStep = {
      stepIndex: 2,
      line: 5,
      eventType: "VARIABLE_ASSIGNMENT",
      description: "Computed sum += 5",
      symbol: "sum",
      previousValue: "10",
      currentValue: "15",
      variables: {},
      callStack: [],
      heapObjects: {},
      output: "",
    };

    const alu = simulateAluOperation(step);
    assert.ok(alu);
    assert.equal(alu.op.includes("ADD"), true);
    assert.equal(alu.operandA, 10);
    assert.equal(alu.operandB, 5);
    assert.equal(alu.result, 15);
    assert.equal(alu.flags.zero, false);
    assert.equal(alu.flags.sign, false);
  });

  it("simulateAluOperation computes comparison and flags zero on equality/false", () => {
    const step: TraceStep = {
      stepIndex: 3,
      line: 7,
      eventType: "CONDITION_EVALUATION",
      description: "Evaluated (count >= 10) -> false",
      currentValue: "false",
      variables: {},
      callStack: [],
      heapObjects: {},
      output: "",
    };

    const alu = simulateAluOperation(step);
    assert.ok(alu);
    assert.equal(alu.op.includes("CMP"), true);
    assert.equal(alu.flags.zero, true);
    assert.equal(alu.result, "0 (FALSE)");
  });

  it("buildHeapMemoryBlocks creates 64-bit aligned memory blocks with Mark & Klass words", () => {
    const heapObjects = {
      student_1: {
        id: "student_1",
        type: "Student",
        state: { name: "Alex", score: 95 },
      },
    };

    const blocks = buildHeapMemoryBlocks(heapObjects);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "Student");
    assert.equal(blocks[0].isConceptualAddress, true);
    assert.equal(blocks[0].isObservedData, true);
    assert.equal(blocks[0].addressLabel.includes("0x7FFF_"), true);
    assert.equal(blocks[0].addressLabel.includes("[Conceptual]"), true);
    assert.equal(blocks[0].header.markWord.includes("unlocked"), true);
    assert.equal(blocks[0].header.klassWord.includes("Student.class"), true);
    assert.equal(blocks[0].fields["name"], "Alex");
    assert.equal(blocks[0].fields["score"], "95");
    // Size is divisible by 8 (64-bit alignment)
    assert.equal(blocks[0].sizeBytes % 8, 0);
  });

  it("buildConceptualRegisters explicitly flags all hardware registers as conceptual", () => {
    const registers = buildConceptualRegisters(4, undefined, "100", [
      { slot: 0, name: "args", type: "String[]", value: "[...]", isObserved: true },
      { slot: 1, name: "price", type: "int", value: "100", isObserved: true },
    ]);

    assert.equal(registers.length, 5);
    for (const reg of registers) {
      assert.equal(reg.isConceptual, true);
    }
    const pc = registers.find((r) => r.name === "PC");
    assert.ok(pc);
    assert.equal(pc.value.includes("Offset 4"), true);

    const acc = registers.find((r) => r.name === "ACC");
    assert.ok(acc);
    assert.equal(acc.value, "100");
  });

  it("generateSystemsSimulation builds full synchronized hardware simulation snapshots", () => {
    const trace: TraceResponsePayload = {
      success: true,
      status: "SUCCESS",
      executionTimeMs: 15,
      steps: [
        {
          stepIndex: 0,
          line: 2,
          eventType: "VARIABLE_ASSIGNMENT",
          description: "int price = 100",
          symbol: "price",
          currentValue: "100",
          variables: {
            price: { name: "price", type: "int", value: "100" },
          },
          callStack: [
            {
              methodName: "main",
              className: "Main",
              line: 2,
              localVariables: {},
            },
          ],
          heapObjects: {},
          output: "",
        },
        {
          stepIndex: 1,
          line: 3,
          eventType: "VARIABLE_ASSIGNMENT",
          description: "int quantity = 3",
          symbol: "quantity",
          currentValue: "3",
          variables: {
            price: { name: "price", type: "int", value: "100" },
            quantity: { name: "quantity", type: "int", value: "3" },
          },
          callStack: [
            {
              methodName: "main",
              className: "Main",
              line: 3,
              localVariables: {},
            },
          ],
          heapObjects: {},
          output: "",
        },
      ],
      totalSteps: 2,
      finalOutput: "",
    };

    const instructions: BytecodeInstruction[] = [
      {
        offset: 0,
        opcode: "bipush",
        arguments: "100",
        line: 2,
        explanation: "Push int 100 onto operand stack",
        methodName: "main",
      },
      {
        offset: 2,
        opcode: "istore_1",
        arguments: "",
        line: 2,
        explanation: "Store in slot 1",
        methodName: "main",
      },
      {
        offset: 3,
        opcode: "iconst_3",
        arguments: "",
        line: 3,
        explanation: "Push int 3 onto operand stack",
        methodName: "main",
      },
    ];

    const sim = generateSystemsSimulation(trace, instructions);
    assert.equal(sim.steps.length, 2);
    assert.equal(sim.isConceptualHardwareModel, true);
    assert.equal(sim.totalCycles, 8);
    assert.equal(sim.peakStackDepth, 1);
    assert.equal(sim.steps[0].programCounter, 0);
    assert.equal(sim.steps[0].instructionRegister.startsWith("bipush"), true);
    assert.equal(sim.steps[0].conceptualRegisters.length, 5);
    assert.equal(sim.steps[1].sourceLine, 3);
  });
});
