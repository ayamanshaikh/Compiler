import { apiClient } from "./client";

export interface ServletScenarioResponse {
  id: string;
  name: string;
  description: string;
  servletCode: string;
  webXmlConfig: string;
  defaultMethod: string;
  defaultPath: string;
  defaultHeaders: Record<string, string>;
  defaultParams: Record<string, string>;
  defaultBody?: string;
}

export interface ServletLifecycleStep {
  stepIndex: number;
  phase: string;
  description: string;
  component: string;
  details: Record<string, unknown>;
}

export interface ServletResponseModel {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  sessionAttributes: Record<string, unknown>;
  sessionId?: string;
}

export interface ServletExecuteRequest {
  scenarioId: string;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: string;
  customServletCode?: string;
}

export interface ServletExecuteResponse {
  success: boolean;
  response: ServletResponseModel;
  lifecycleSteps: ServletLifecycleStep[];
  logs: string;
}

export type EntityLifecycleState =
  | "TRANSIENT"
  | "PERSISTENT"
  | "DETACHED"
  | "REMOVED";

export interface HibernateStep {
  stepIndex: number;
  title: string;
  description: string;
  entityName: string;
  entityState: EntityLifecycleState;
  sqlStatements: string[];
  firstLevelCache: Record<string, unknown>;
  tableSnapshot: Record<string, unknown>[];
}

export interface HibernateScenarioResponse {
  id: string;
  name: string;
  description: string;
  entityJavaCode: string;
  operationCode: string;
}

export interface HibernateExecuteRequest {
  scenarioId: string;
  action?: string;
  params?: Record<string, unknown>;
}

export interface HibernateExecuteResponse {
  success: boolean;
  scenarioId: string;
  scenarioName: string;
  steps: HibernateStep[];
  generatedSqlList: string[];
  totalQueriesFired: number;
  explanation: string;
}

export async function fetchServletScenarios(): Promise<ServletScenarioResponse[]> {
  return apiClient.get<ServletScenarioResponse[]>("enterprise/servlets/scenarios");
}

export async function executeServlet(
  request: ServletExecuteRequest
): Promise<ServletExecuteResponse> {
  return apiClient.post<ServletExecuteResponse>("enterprise/servlets/execute", request);
}

export async function fetchHibernateScenarios(): Promise<HibernateScenarioResponse[]> {
  return apiClient.get<HibernateScenarioResponse[]>("enterprise/hibernate/scenarios");
}

export async function executeHibernate(
  request: HibernateExecuteRequest
): Promise<HibernateExecuteResponse> {
  return apiClient.post<HibernateExecuteResponse>("enterprise/hibernate/execute", request);
}
