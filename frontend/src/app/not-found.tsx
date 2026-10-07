import NextLink from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell showSidebar={false}>
      <PageContainer className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
          <FileQuestion className="w-7 h-7 text-blue-400" />
        </div>
        <div className="font-mono text-xs text-blue-400 font-semibold tracking-wider uppercase mb-1">
          404 Not Found
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
          Page Does Not Exist
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          The requested route was not found in CodeVista AI. Verify the URL or return to the main workspace.
        </p>
        <NextLink href="/">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </NextLink>
      </PageContainer>
    </AppShell>
  );
}
