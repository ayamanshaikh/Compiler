import test from "node:test";
import assert from "node:assert/strict";
import {
  languageRegistry,
  JavaLanguageAdapter,
  PythonLanguageAdapter,
  CppLanguageAdapter,
  CLanguageAdapter,
} from "./languageAdapters";

test("Multi-Language Adapter Architecture & Registry Verification", async (t) => {
  await t.test("Registry registers Java, Python, C++, and C adapters by default", () => {
    const ids = languageRegistry.getRegisteredLanguageIds();
    assert.deepEqual(ids, ["java", "python", "cpp", "c"]);
    assert.equal(languageRegistry.getAll().length, 4);
  });

  await t.test("Registry resolves language from filename extension reliably", () => {
    assert.equal(languageRegistry.detectFromFilename("script.py"), "python");
    assert.equal(languageRegistry.detectFromFilename("main.cpp"), "cpp");
    assert.equal(languageRegistry.detectFromFilename("engine.cxx"), "cpp");
    assert.equal(languageRegistry.detectFromFilename("algorithm.c"), "c");
    assert.equal(languageRegistry.detectFromFilename("Solution.java"), "java");
    assert.equal(languageRegistry.detectFromFilename("unknown.txt"), "java"); // Fallback
    assert.equal(languageRegistry.detectFromFilename(""), "java");
  });

  await t.test("Registry safely falls back to Java adapter on unrecognized language query", () => {
    const fallback = languageRegistry.get("ruby");
    assert.equal(fallback.id, "java");
  });

  await t.test("JavaAdapter normalizes JVM trace events and parses javac diagnostics", () => {
    const javaAdapter = new JavaLanguageAdapter();
    assert.equal(javaAdapter.capabilities.memoryModel, "jvm_hotspot");
    assert.equal(javaAdapter.capabilities.executionParadigm, "compiled_bytecode");

    const rawEvent = {
      stepIndex: 4,
      sourceLine: 12,
      eventType: "VARIABLE_ASSIGNMENT",
      symbol: "total",
      currentValue: "300",
      previousValue: "0",
    };
    const normalized = javaAdapter.normalizeEvent(rawEvent, 4);
    assert.equal(normalized.sequence, 4);
    assert.equal(normalized.conceptType, "VALUE_CHANGE");
    assert.equal(normalized.symbol, "total");
    assert.equal(normalized.currentValue, "300");

    const diagnosticOutput = `Main.java:7: error: ';' expected\n        int x = 10\n                  ^`;
    const diags = javaAdapter.parseDiagnostics(diagnosticOutput);
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 7);
    assert.equal(diags[0].diagnosticType, "ERROR");
    assert.ok(diags[0].message.includes("';' expected"));
  });

  await t.test("PythonAdapter normalizes CPython events and parses traceback diagnostics", () => {
    const pyAdapter = new PythonLanguageAdapter();
    assert.equal(pyAdapter.capabilities.memoryModel, "cpython_reference");
    assert.equal(pyAdapter.capabilities.supportsDynamicTyping, true);

    const rawEvent = {
      line: 5,
      eventType: "STORE_FAST",
      symbol: "scores",
      currentValue: "[10, 20, 30]",
    };
    const normalized = pyAdapter.normalizeEvent(rawEvent, 1);
    assert.equal(normalized.conceptType, "VARIABLE_ASSIGNMENT");
    assert.equal(normalized.variables.scores.type, "list");
    assert.equal(normalized.metadata.language, "python");

    const traceback = `Traceback (most recent call last):\n  File "main.py", line 6, in <module>\nZeroDivisionError: division by zero`;
    const diags = pyAdapter.parseDiagnostics(traceback);
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 6);
    assert.equal(diags[0].code, "ZeroDivisionError");
    assert.ok(diags[0].message.includes("ZeroDivisionError: division by zero"));
  });

  await t.test("CppAdapter normalizes pointer addresses and parses GCC/Clang diagnostics", () => {
    const cppAdapter = new CppLanguageAdapter();
    assert.equal(cppAdapter.capabilities.memoryModel, "native_address_space");
    assert.equal(cppAdapter.capabilities.supportsPointers, true);

    const pointerEvent = {
      line: 8,
      eventType: "POINTER_INIT",
      symbol: "ptr",
      currentValue: "0x7ffd98b0",
    };
    const normalized = cppAdapter.normalizeEvent(pointerEvent, 2);
    assert.equal(normalized.metadata.isPointer, true);
    assert.equal(normalized.metadata.targetAddress, "0x7ffd98b0");

    const gccOutput = `main.cpp:14:5: error: 'ptr' was not declared in this scope\n    *ptr = 100;`;
    const diags = cppAdapter.parseDiagnostics(gccOutput);
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 14);
    assert.equal(diags[0].column, 5);
    assert.ok(diags[0].message.includes("'ptr' was not declared in this scope"));
  });

  await t.test("CLanguageAdapter supports manual memory allocation archetypes", () => {
    const cAdapter = new CLanguageAdapter();
    assert.equal(cAdapter.capabilities.defaultFileExtension, ".c");
    const samples = cAdapter.getSamplePrograms();
    assert.ok(samples.length > 0);
    assert.ok(samples[0].sourceCode.includes("malloc"));
    assert.ok(samples[0].sourceCode.includes("free"));
  });
});
