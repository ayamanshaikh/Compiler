/**
 * CodeVista AI - Static Code Concept Detection Engine
 * 
 * Inspects source code to discover algorithmic, syntactic, and runtime concepts
 * present in the user's program to guide the adaptive visualization engine.
 */

export type ConceptCategory =
  | "CONTROL_FLOW"
  | "DATA_STRUCTURES"
  | "OOP"
  | "COMPUTATION"
  | "IO_SYSTEMS";

export interface DetectedConcept {
  id: string;
  name: string;
  category: ConceptCategory;
  badge: string;
  description: string;
  color: string;
  occurrences: number;
}

export function detectCodeConcepts(sourceCode: string): DetectedConcept[] {
  if (!sourceCode || sourceCode.trim().length === 0) {
    return [];
  }

  const concepts: DetectedConcept[] = [];
  const lines = sourceCode.split(/\r?\n/);

  // 1. Loops detection
  let forCount = 0;
  let whileCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/\bfor\s*\(/.test(trimmed)) forCount++;
    if (/\bwhile\s*\(/.test(trimmed) && !trimmed.startsWith("}")) whileCount++;
    if (/\bdo\s*\{/.test(trimmed)) whileCount++;
  }
  const loopTotal = forCount + whileCount;
  if (loopTotal > 0) {
    concepts.push({
      id: "loops",
      name: "Iterative Loops",
      category: "CONTROL_FLOW",
      badge: "LOOPS",
      description: `Discovered ${loopTotal} loop statement${loopTotal > 1 ? "s" : ""} (for/while iterations).`,
      color: "amber",
      occurrences: loopTotal,
    });
  }

  // 2. Condition checks
  let branchCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/\bif\s*\(/.test(trimmed)) branchCount++;
    if (/\bswitch\s*\(/.test(trimmed)) branchCount++;
    if (/\?[^:]+:\s*/.test(trimmed)) branchCount++;
  }
  if (branchCount > 0) {
    concepts.push({
      id: "conditions",
      name: "Conditional Branches",
      category: "CONTROL_FLOW",
      badge: "BRANCHES",
      description: `Discovered ${branchCount} conditional test${branchCount > 1 ? "s" : ""} (if/else/switch).`,
      color: "blue",
      occurrences: branchCount,
    });
  }

  // 3. Arrays
  let arrayDeclarations = 0;
  for (const line of lines) {
    if (/\[\s*\]/.test(line)) arrayDeclarations++;
  }
  if (arrayDeclarations > 0) {
    concepts.push({
      id: "arrays",
      name: "Array Data Structures",
      category: "DATA_STRUCTURES",
      badge: "ARRAYS",
      description: `Discovered ${arrayDeclarations} array allocation${arrayDeclarations > 1 ? "s" : ""} or indexed access${arrayDeclarations > 1 ? "es" : ""}.`,
      color: "emerald",
      occurrences: arrayDeclarations,
    });
  }

  // 4. OOP & Object Instantiations
  let classCount = 0;
  let newObjectCount = 0;
  for (const line of lines) {
    if (/\bclass\s+[A-Za-z0-9_$]+/.test(line)) classCount++;
    if (/\bnew\s+[A-Za-z0-9_$]+\s*\(/.test(line)) newObjectCount++;
  }
  if (classCount > 1 || newObjectCount > 0) {
    concepts.push({
      id: "oop",
      name: "Object-Oriented Programming",
      category: "OOP",
      badge: "OBJECTS & HEAP",
      description: `Discovered custom class structures and new object instantiations.`,
      color: "purple",
      occurrences: classCount + newObjectCount,
    });
  }

  // 5. Recursion detection
  // Search for method definition and self-invocation
  const methodPatterns = /public\s+(?:static\s+)?(?:[A-Za-z0-9_<>[\]]+)\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = methodPatterns.exec(sourceCode)) !== null) {
    const methodName = match[1];
    if (methodName !== "main") {
      const selfCallPattern = new RegExp(`\\b${methodName}\\s*\\(`, "g");
      const calls = (sourceCode.match(selfCallPattern) || []).length;
      if (calls >= 2) {
        // At least definition + self-call
        concepts.push({
          id: "recursion",
          name: "Recursive Call Hierarchy",
          category: "CONTROL_FLOW",
          badge: "RECURSION",
          description: `Method '${methodName}' invokes itself recursively.`,
          color: "rose",
          occurrences: calls - 1,
        });
        break;
      }
    }
  }

  // 6. Arithmetic & Math Expressions
  let expressionCount = 0;
  for (const line of lines) {
    if (/=\s*[^;]+[+\-*/%][^;]+;/.test(line)) expressionCount++;
  }
  if (expressionCount > 0) {
    concepts.push({
      id: "expressions",
      name: "Arithmetic Expressions",
      category: "COMPUTATION",
      badge: "ARITHMETIC",
      description: `Found ${expressionCount} mathematical calculation${expressionCount > 1 ? "s" : ""}.`,
      color: "cyan",
      occurrences: expressionCount,
    });
  }

  // 7. Console I/O
  let printCount = 0;
  for (const line of lines) {
    if (/System\.out\.print(?:ln)?\(/.test(line)) printCount++;
  }
  if (printCount > 0) {
    concepts.push({
      id: "io",
      name: "Console Output Streams",
      category: "IO_SYSTEMS",
      badge: "I/O STREAM",
      description: `Found ${printCount} standard output print statement${printCount > 1 ? "s" : ""}.`,
      color: "indigo",
      occurrences: printCount,
    });
  }

  return concepts;
}
