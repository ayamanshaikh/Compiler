"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ServletSandbox } from "@/components/enterprise/ServletSandbox";
import { HibernateWorkbench } from "@/components/enterprise/HibernateWorkbench";
import {
  ServletScenarioResponse,
  HibernateScenarioResponse,
  fetchServletScenarios,
  fetchHibernateScenarios,
} from "@/lib/api/enterprise";
import {
  FALLBACK_SERVLET_SCENARIOS,
  FALLBACK_HIBERNATE_SCENARIOS,
} from "@/lib/data/enterpriseData";
import { Globe, Database } from "lucide-react";

function EnterpriseContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "hibernate" ? "hibernate" : "servlet";
  const initialScenario = searchParams.get("scenario") || undefined;

  const [activeTab, setActiveTab] = useState<"servlet" | "hibernate">(initialTab);
  const [servletScenarios, setServletScenarios] = useState<ServletScenarioResponse[]>(
    FALLBACK_SERVLET_SCENARIOS
  );
  const [hibernateScenarios, setHibernateScenarios] = useState<HibernateScenarioResponse[]>(
    FALLBACK_HIBERNATE_SCENARIOS
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([fetchServletScenarios(), fetchHibernateScenarios()])
      .then(([servletRes, hibernateRes]) => {
        if (!isMounted) return;
        if (servletRes.status === "fulfilled" && servletRes.value.length > 0) {
          setServletScenarios(servletRes.value);
        }
        if (hibernateRes.status === "fulfilled" && hibernateRes.value.length > 0) {
          setHibernateScenarios(hibernateRes.value);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Enterprise Java: Servlets & Hibernate"
          description="Interactive educational sandboxes grounded in real Jakarta Servlet containers and Hibernate JPA ORM persistence contexts."
          badge={
            <Badge variant="success" size="sm" dot>
              Jakarta EE & Hibernate 7
            </Badge>
          }
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
          <Button
            variant={activeTab === "servlet" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("servlet")}
            className={
              activeTab === "servlet"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }
          >
            <Globe className="w-4 h-4 mr-1.5" />
            Servlet Educational Sandbox
          </Button>

          <Button
            variant={activeTab === "hibernate" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("hibernate")}
            className={
              activeTab === "hibernate"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }
          >
            <Database className="w-4 h-4 mr-1.5" />
            Hibernate & ORM Workbench
          </Button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <LoadingState message="Loading enterprise educational scenarios..." />
        ) : activeTab === "servlet" ? (
          <ServletSandbox
            key={`servlet-${servletScenarios.length}`}
            scenarios={servletScenarios}
            initialScenarioId={initialScenario}
          />
        ) : (
          <HibernateWorkbench
            key={`hibernate-${hibernateScenarios.length}`}
            scenarios={hibernateScenarios}
            initialScenarioId={initialScenario}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

export default function EnterprisePage() {
  return (
    <Suspense fallback={<LoadingState message="Initializing enterprise sandbox..." />}>
      <EnterpriseContent />
    </Suspense>
  );
}
