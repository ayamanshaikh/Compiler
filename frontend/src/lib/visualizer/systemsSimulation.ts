import {
  TraceResponsePayload,
  TraceStep,
  BytecodeInstruction,
} from "@/lib/api/types";

export type CpuExecutionPhase = "FETCH" | "DECODE" | "EXECUTE" | "WRITEBACK";

export interface AluFlagStatus {
  zero: boolean;
  sign: boolean;
  overflow?: boolean;
}

export interface AluOperation {
  op: string;
  operandA: string | number;
  operandB?: string | number;
  result: string | number;
  flags: AluFlagStatus;
  description: string;
}

export interface ConceptualRegister {
  name: string;
  label: string;
  value: string;
  role: string;
  isConceptual: true;
}

export interface OperandStackEntry {
  index: number;
  value: string;
  type: string;
  isTop: boolean;
  sourceOpcode?: string;
}

export interface LocalVariableSlot {
  slot: number;
  name: string;
  type: string;
  value: string;
  isObserved: true;
}

export interface StackFrameView {
  methodName: string;
  className: string;
  line: number;
  frameDepth: number;
  localSlots: LocalVariableSlot[];
  operandStack: OperandStackEntry[];
  returnAddress?: string;
}

export interface HeapMemoryBlock {
  id: string;
  addressLabel: string;
  type: string;
  header: {
    markWord: string;
    klassWord: string;
  };
  sizeBytes: number;
  fields: Record<string, string>;
  isConceptualAddress: true;
  isObservedData: boolean;
}

export interface SystemsStepSnapshot {
  stepIndex: number;
  sourceLine: number;
  programCounter: number;
  instructionRegister: string;
  cpuPhase: CpuExecutionPhase;
  alu?: AluOperation;
  conceptualRegisters: ConceptualRegister[];
  callStack: StackFrameView[];
  activeFrame?: StackFrameView;
  heapBlocks: HeapMemoryBlock[];
  explanation: string;
  systemsInsight: string;
}

export interface SystemsSimulationResult {
  steps: SystemsStepSnapshot[];
  totalCycles: number;
  peakStackDepth: number;
  peakOperandStackDepth: number;
  totalHeapAllocations: number;
  isConceptualHardwareModel: true;
}

/**
 * Maps raw trace variables into indexed JVM Local Variable Table slots.
 */
export function buildLocalVariableSlots(
  variables: Record<string, { name: string; type: string; value: string }>,
  isStaticMethod = true
): LocalVariableSlot[] {
  const slots: LocalVariableSlot[] = [];

  // Slot 0 is conventionally `this` (instance methods) or `args` (static main)
  slots.push({
    slot: 0,
    name: isStaticMethod ? "args" : "this",
    type: isStaticMethod ? "String[]" : "reference",
    value: isStaticMethod ? "[...]" : "0x7FFF_THIS",
    isObserved: true,
  });

  let currentSlot = 1;
  const sortedKeys = Object.keys(variables).sort();
  for (const key of sortedKeys) {
    const v = variables[key];
    slots.push({
      slot: currentSlot++,
      name: v.name,
      type: v.type,
      value: v.value,
      isObserved: true,
    });
  }

  return slots;
}

/**
 * Reconstructs the JVM operand stack for a given trace step and event type.
 */
export function simulateOperandStack(
  step: TraceStep,
  matchingInstruction?: BytecodeInstruction
): OperandStackEntry[] {
  const stack: OperandStackEntry[] = [];

  if (matchingInstruction) {
    const op = matchingInstruction.opcode.toLowerCase();
    if (op.startsWith("iconst_") || op.startsWith("bipush") || op.startsWith("ldc")) {
      const val = matchingInstruction.arguments || step.currentValue || "0";
      stack.push({
        index: 0,
        value: val,
        type: "int",
        isTop: true,
        sourceOpcode: matchingInstruction.opcode,
      });
      return stack;
    }

    if (op.startsWith("iadd") || op.startsWith("isub") || op.startsWith("imul") || op.startsWith("idiv")) {
      stack.push({
        index: 0,
        value: step.currentValue || "0",
        type: "int",
        isTop: true,
        sourceOpcode: matchingInstruction.opcode,
      });
      return stack;
    }
  }

  // Fallback heuristic based on event type
  if (step.eventType === "VARIABLE_ASSIGNMENT" || step.eventType === "VARIABLE_DECLARATION") {
    if (step.currentValue !== undefined) {
      stack.push({
        index: 0,
        value: step.currentValue,
        type: /^-?\d+$/.test(step.currentValue) ? "int" : "reference",
        isTop: true,
        sourceOpcode: "istore",
      });
    }
  } else if (step.eventType === "CONDITION_EVALUATION") {
    stack.push({
      index: 0,
      value: step.currentValue ?? "true",
      type: "boolean",
      isTop: true,
      sourceOpcode: "if_icmp",
    });
  }

  return stack;
}

/**
 * Simulates the Arithmetic Logic Unit (ALU) operation for mathematical and comparison steps.
 */
export function simulateAluOperation(
  step: TraceStep,
  matchingInstruction?: BytecodeInstruction
): AluOperation | undefined {
  const desc = step.description.toLowerCase();
  const op = matchingInstruction?.opcode.toLowerCase() || "";

  // Check for addition
  if (op.includes("add") || desc.includes("add") || desc.includes("+") || desc.includes("sum")) {
    const val = parseInt(step.currentValue || "0", 10) || 0;
    const prev = parseInt(step.previousValue || "0", 10) || 0;
    const diff = val - prev;
    return {
      op: "ADD (32-bit integer addition)",
      operandA: prev,
      operandB: diff !== 0 ? diff : val,
      result: val,
      flags: {
        zero: val === 0,
        sign: val < 0,
        overflow: false,
      },
      description: `ALU computed ${prev} + ${diff !== 0 ? diff : val} = ${val}`,
    };
  }

  // Check for multiplication
  if (op.includes("mul") || desc.includes("multiply") || desc.includes("*")) {
    const val = parseInt(step.currentValue || "0", 10) || 0;
    return {
      op: "MUL (32-bit integer multiplication)",
      operandA: step.previousValue || "A",
      operandB: "B",
      result: val,
      flags: {
        zero: val === 0,
        sign: val < 0,
      },
      description: `ALU multiplier unit calculated product: ${val}`,
    };
  }

  // Check for subtraction
  if (op.includes("sub") || desc.includes("subtract") || desc.includes("-")) {
    const val = parseInt(step.currentValue || "0", 10) || 0;
    return {
      op: "SUB (32-bit two's complement subtraction)",
      operandA: step.previousValue || "0",
      operandB: "offset",
      result: val,
      flags: {
        zero: val === 0,
        sign: val < 0,
      },
      description: `ALU subtractor evaluated difference: ${val}`,
    };
  }

  // Check for comparison / relational check
  if (step.eventType === "CONDITION_EVALUATION" || op.includes("cmp") || desc.includes("compare")) {
    const resBool = step.currentValue === "true" || desc.includes("true");
    return {
      op: "CMP (Integer comparator & flag test)",
      operandA: "Left",
      operandB: "Right",
      result: resBool ? "1 (TRUE)" : "0 (FALSE)",
      flags: {
        zero: !resBool,
        sign: false,
      },
      description: `ALU comparator evaluated condition: ${resBool ? "PASS" : "FAIL"}`,
    };
  }

  return undefined;
}

/**
 * Builds conceptual 64-bit aligned heap memory blocks from authentic heap objects.
 */
export function buildHeapMemoryBlocks(
  heapObjects: Record<string, { id: string; type: string; state?: Record<string, unknown> }>
): HeapMemoryBlock[] {
  const blocks: HeapMemoryBlock[] = [];
  const entries = Object.entries(heapObjects);

  entries.forEach(([key, obj], idx) => {
    const fields: Record<string, string> = {};
    if (obj.state) {
      for (const [k, v] of Object.entries(obj.state)) {
        fields[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    }

    const fieldCount = Object.keys(fields).length;
    // Standard 64-bit JVM Object Layout: 8 bytes Mark Word + 4 bytes compressed Klass Word + instance data + 4 bytes padding
    const sizeBytes = Math.ceil((12 + fieldCount * 4) / 8) * 8;
    const hexAddr = `0x7FFF_${(0x1000 + idx * 0x0040).toString(16).toUpperCase()}`;

    blocks.push({
      id: obj.id || key,
      addressLabel: `${hexAddr} [Conceptual]`,
      type: obj.type || "Object",
      header: {
        markWord: "0x0000000000000001 (unlocked)",
        klassWord: `0x${(0x20000000 + idx * 0x100).toString(16)} (${obj.type}.class)`,
      },
      sizeBytes,
      fields,
      isConceptualAddress: true,
      isObservedData: true,
    });
  });

  return blocks;
}

/**
 * Derives conceptual CPU registers mapped to JVM state.
 * Strictly flagged with `isConceptual: true` to adhere to zero-fabrication guidelines.
 */
export function buildConceptualRegisters(
  pc: number,
  alu?: AluOperation,
  operandStackTop?: string,
  localSlots: LocalVariableSlot[] = []
): ConceptualRegister[] {
  const r0Val = localSlots.length > 1 ? localSlots[1].value : "0";
  const r1Val = localSlots.length > 2 ? localSlots[2].value : "0";

  return [
    {
      name: "PC",
      label: "Program Counter",
      value: `0x${pc.toString(16).padStart(4, "0").toUpperCase()} (Offset ${pc})`,
      role: "Bytecode offset of next JVM opcode to execute",
      isConceptual: true,
    },
    {
      name: "ACC",
      label: "Accumulator Register",
      value: alu ? String(alu.result) : operandStackTop || "0",
      role: "ALU temporary result and top of expression evaluation",
      isConceptual: true,
    },
    {
      name: "R0",
      label: "General Register R0",
      value: r0Val,
      role: "Simulated hardware register mapped to Local Variable slot 1",
      isConceptual: true,
    },
    {
      name: "R1",
      label: "General Register R1",
      value: r1Val,
      role: "Simulated hardware register mapped to Local Variable slot 2",
      isConceptual: true,
    },
    {
      name: "SP",
      label: "Stack Pointer",
      value: operandStackTop !== undefined ? "0x0001" : "0x0000",
      role: "Points to top of the JVM operand stack in current frame",
      isConceptual: true,
    },
  ];
}

/**
 * Master generation engine: converts an execution trace and optional bytecode
 * into a step-by-step Systems and Hardware Simulation result.
 */
export function generateSystemsSimulation(
  trace: TraceResponsePayload,
  bytecodeInstructions: BytecodeInstruction[] = []
): SystemsSimulationResult {
  const steps: SystemsStepSnapshot[] = [];
  let peakStackDepth = 1;
  let peakOperandStackDepth = 0;
  let totalHeapAllocations = 0;

  trace.steps.forEach((step, sIdx) => {
    // Correlate matching bytecode instruction by line number
    const matchingInst = bytecodeInstructions.find((b) => b.line === step.line);
    const pc = matchingInst ? matchingInst.offset : sIdx * 2;
    const ir = matchingInst
      ? `${matchingInst.opcode} ${matchingInst.arguments}`.trim()
      : step.operation || step.eventType.toLowerCase();

    // Determine CPU execution phase
    const cpuPhase: CpuExecutionPhase =
      step.eventType === "VARIABLE_ASSIGNMENT" || step.eventType === "VARIABLE_DECLARATION"
        ? "WRITEBACK"
        : step.eventType === "CONDITION_EVALUATION"
        ? "EXECUTE"
        : step.eventType === "METHOD_ENTRY"
        ? "FETCH"
        : "EXECUTE";

    // ALU Operation
    const alu = simulateAluOperation(step, matchingInst);

    // Operand Stack
    const operandStack = simulateOperandStack(step, matchingInst);
    if (operandStack.length > peakOperandStackDepth) {
      peakOperandStackDepth = operandStack.length;
    }

    // Local Variables
    const localSlots = buildLocalVariableSlots(step.variables);

    // Call Stack Frames
    const callStack: StackFrameView[] = (step.callStack || []).map((frame, fIdx) => ({
      methodName: frame.methodName || "main",
      className: frame.className || "Main",
      line: frame.line || step.line,
      frameDepth: fIdx + 1,
      localSlots: fIdx === 0 ? localSlots : [],
      operandStack: fIdx === 0 ? operandStack : [],
      returnAddress: fIdx > 0 ? `PC: 0x${((sIdx - 1) * 2).toString(16)}` : undefined,
    }));

    if (callStack.length > peakStackDepth) {
      peakStackDepth = callStack.length;
    }

    // Heap Memory Blocks
    const heapBlocks = buildHeapMemoryBlocks(step.heapObjects || {});
    if (heapBlocks.length > totalHeapAllocations) {
      totalHeapAllocations = heapBlocks.length;
    }

    // Conceptual Registers
    const topVal = operandStack.length > 0 ? operandStack[0].value : undefined;
    const conceptualRegisters = buildConceptualRegisters(pc, alu, topVal, localSlots);

    // Systems Insight Synthesis
    const systemsInsight = generateSystemsInsight(step, matchingInst, alu, cpuPhase);

    steps.push({
      stepIndex: step.stepIndex,
      sourceLine: step.line,
      programCounter: pc,
      instructionRegister: ir,
      cpuPhase,
      alu,
      conceptualRegisters,
      callStack,
      activeFrame: callStack[0],
      heapBlocks,
      explanation: step.description,
      systemsInsight,
    });
  });

  return {
    steps,
    totalCycles: steps.length * 4, // 4 CPU cycles per high-level instruction step (Fetch, Decode, Execute, Writeback)
    peakStackDepth,
    peakOperandStackDepth,
    totalHeapAllocations,
    isConceptualHardwareModel: true,
  };
}

function generateSystemsInsight(
  step: TraceStep,
  matchingInst?: BytecodeInstruction,
  alu?: AluOperation,
  phase?: CpuExecutionPhase
): string {
  if (alu) {
    return `CPU ALU performed ${alu.op} operation. Flags set: Zero=${alu.flags.zero ? "1" : "0"}, Sign=${alu.flags.sign ? "1" : "0"}. Value written back to JVM stack.`;
  }
  if (matchingInst) {
    return `JVM executed opcode '${matchingInst.opcode}'. ${matchingInst.explanation || "Updated operand stack and local variable slots."}`;
  }
  if (step.eventType === "VARIABLE_ASSIGNMENT") {
    return `Memory Write: Updated local variable '${step.symbol || "var"}' to value '${step.currentValue}'. Local variable table slot written.`;
  }
  if (step.eventType === "CONDITION_EVALUATION") {
    return `Control Flow: Evaluated boolean branch condition '${step.currentValue}'. Branch predictor / jump target resolved.`;
  }
  return `Execution Phase: ${phase || "EXECUTE"}. JVM program counter incremented; stack frame synchronized.`;
}
