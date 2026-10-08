export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
}

export interface PingRequest {
  message: string;
}

export interface PingResponse {
  echo: string;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: ValidationError[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  readonly path?: string;
  readonly validationErrors?: ValidationError[];

  constructor(payload: ErrorResponse | { status: number; message: string }) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.error = "error" in payload ? payload.error : "API Error";
    this.path = "path" in payload ? payload.path : undefined;
    this.validationErrors = "validationErrors" in payload ? payload.validationErrors : undefined;
  }
}

export type TopicDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface CodeExample {
  title: string;
  code: string;
  explanation?: string;
}

export interface TopicSummary {
  id: number;
  title: string;
  slug: string;
  description: string;
  whyItMatters?: string;
  difficulty: TopicDifficulty;
  internalUnit?: string;
  sortOrder: number;
  keyPoints: string[];
  practiceQuestionCount: number;
}

export interface TopicDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  explanation?: string;
  whyItMatters?: string;
  syntax?: string;
  difficulty: TopicDifficulty;
  internalUnit?: string;
  sortOrder: number;
  keyPoints: string[];
  commonMistakes: string[];
  relatedTopicSlugs: string[];
  codeExamples: CodeExample[];
  practiceQuestionCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DiagnosticType = "ERROR" | "WARNING" | "NOTE" | "OTHER";

export interface ErrorExplanation {
  technicalError: string;
  simpleExplanation: string;
  whyItHappened: string;
  howToFix: string;
  affectedLine: number;
  relevantSource?: string;
  suggestion?: string;
}

export interface CompilerDiagnostic {
  line: number;
  column: number;
  message: string;
  sourceContext?: string;
  diagnosticType: DiagnosticType;
  code?: string;
  explanation?: ErrorExplanation;
}

export type CompilerStatus = "SUCCESS" | "WARNING" | "ERROR" | "TIMEOUT";

export interface CompileRequestPayload {
  language: string;
  sourceCode: string;
  className?: string;
}

export interface CompileResponsePayload {
  success: boolean;
  compilerStatus: CompilerStatus;
  compilationTimeMs: number;
  output?: string;
  diagnostics: CompilerDiagnostic[];
  mainClass?: string;
}

export type ExecutionStatus =
  | "SUCCESS"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIMEOUT"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "SECURITY_VIOLATION";

export interface ExecuteRequestPayload {
  language: string;
  sourceCode: string;
  input?: string;
  className?: string;
}

export interface ExecuteResponsePayload {
  success: boolean;
  status: ExecutionStatus;
  output: string;
  runtimeError: string;
  executionTimeMs: number;
  exitCode: number;
  diagnostics?: CompilerDiagnostic[];
}

export type TraceEventType =
  | "LINE"
  | "VARIABLE_DECLARATION"
  | "VARIABLE_ASSIGNMENT"
  | "CONDITION_EVALUATION"
  | "LOOP_ITERATION"
  | "LOOP_TERMINATION"
  | "METHOD_ENTRY"
  | "METHOD_EXIT"
  | "ARRAY_ACCESS"
  | "ARRAY_MUTATION"
  | "OBJECT_CREATION"
  | "FIELD_MUTATION"
  | "COLLECTION_OPERATION"
  | "EXCEPTION_THROWN"
  | "EXCEPTION_CAUGHT"
  | "THREAD_STATE"
  | "OUTPUT_PRINT";

export interface VariableSnapshot {
  name: string;
  type: string;
  value: string;
  previousValue?: string;
}

export interface StackFrameSnapshot {
  methodName: string;
  className: string;
  line: number;
  localVariables?: Record<string, VariableSnapshot>;
}

export interface HeapObjectSnapshot {
  id: string;
  type: string;
  state?: Record<string, unknown>;
}

export interface TraceStep {
  stepIndex: number;
  line: number;
  column?: number;
  eventType: TraceEventType;
  description: string;
  scope?: string;
  symbol?: string;
  previousValue?: string;
  currentValue?: string;
  operation?: string;
  relatedEvent?: string;
  metadata?: Record<string, unknown>;
  variables: Record<string, VariableSnapshot>;
  callStack: StackFrameSnapshot[];
  heapObjects: Record<string, HeapObjectSnapshot>;
  output: string;
  threadName?: string;
}

export type NormalizedConceptType =
  | "VARIABLE_DECLARATION"
  | "VARIABLE_ASSIGNMENT"
  | "VALUE_CHANGE"
  | "EXPRESSION_EVALUATION"
  | "CONDITION_CHECK"
  | "BRANCH"
  | "LOOP_START"
  | "LOOP_ITERATION"
  | "LOOP_END"
  | "FUNCTION_CALL"
  | "METHOD_CALL"
  | "PARAMETER_BIND"
  | "RETURN"
  | "OBJECT_CREATE"
  | "CONSTRUCTOR_CALL"
  | "FIELD_UPDATE"
  | "ARRAY_ACCESS"
  | "ARRAY_MUTATION"
  | "COLLECTION_OPERATION"
  | "EXCEPTION"
  | "OUTPUT"
  | "RECURSION"
  | "COMPARISON"
  | "SWAP"
  | "SEARCH_STEP"
  | "SORT_STEP"
  | "LINE_EXECUTION"
  | "GENERIC_STEP";

export interface NormalizedExecutionEvent {
  sequence: number;
  eventType: TraceEventType;
  conceptType: NormalizedConceptType;
  sourceLine: number;
  sourceColumn?: number;
  scope: string;
  symbol?: string;
  previousValue?: string;
  currentValue?: string;
  operation?: string;
  relatedEvent?: string;
  metadata: Record<string, unknown>;
  description: string;
  output: string;
  variables: Record<string, VariableSnapshot>;
  callStack: StackFrameSnapshot[];
  heapObjects: Record<string, HeapObjectSnapshot>;
}

export type VisualizationMode = "VISUAL_EXECUTION" | "EXPLANATION_FALLBACK";

export type VisualRendererType =
  | "VARIABLE"
  | "EXPRESSION"
  | "COMPARISON"
  | "CONDITION"
  | "LOOP"
  | "ARRAY"
  | "ARRAY_OPERATION"
  | "CALL_STACK"
  | "PARAMETER_BIND"
  | "RECURSION"
  | "OBJECT"
  | "OUTPUT"
  | "GENERIC_VISUAL"
  | "NONE";

export interface VisualizationStrategyDecision {
  mode: VisualizationMode;
  rendererType: VisualRendererType;
  confidence: "FULL" | "PARTIAL" | "FALLBACK";
  reason: string;
  suggestedDetailLevel: "beginner" | "detailed";
  conceptType: NormalizedConceptType;
}

export interface ProgramStrategySummary {
  totalEvents: number;
  visualEventCount: number;
  fallbackEventCount: number;
  primaryMode: "VISUAL" | "MIXED" | "EXPLANATORY";
  activeRenderers: VisualRendererType[];
}

export interface StructuredStepExplanation {
  stepNumber: number;
  sourceLine: number;
  lineContent?: string;
  whatHappens: string;
  currentValues: Record<string, string>;
  whyItHappens: string;
  result: string;
  learnMore?: string;
  controlFlowNote?: string;
  category: string;
  isVisualCapable: boolean;
}

export interface TraceRequestPayload {
  language: string;
  sourceCode: string;
  input?: string;
  className?: string;
}

export interface TraceResponsePayload {
  success: boolean;
  status: ExecutionStatus;
  totalSteps: number;
  steps: TraceStep[];
  finalOutput: string;
  executionTimeMs: number;
  runtimeError?: string;
  diagnostics?: CompilerDiagnostic[];
}

