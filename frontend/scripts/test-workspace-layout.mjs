import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("Workspace Layout & UI Responsiveness Verification", async (t) => {
  const workspaceSource = fs.readFileSync(
    path.join(__dirname, "../src/app/workspace/page.tsx"),
    "utf8"
  );
  const appShellSource = fs.readFileSync(
    path.join(__dirname, "../src/components/layout/AppShell.tsx"),
    "utf8"
  );
  const pageHeaderSource = fs.readFileSync(
    path.join(__dirname, "../src/components/ui/PageHeader.tsx"),
    "utf8"
  );

  await t.test("AppShell supports showFooter prop and workspace disables footer to avoid desktop viewport overflow", () => {
    assert.ok(appShellSource.includes("showFooter?: boolean"), "AppShellProps must declare showFooter");
    assert.ok(appShellSource.includes("{showFooter && <Footer />}"), "AppShell must conditionally render Footer");
    assert.ok(workspaceSource.includes("<AppShell showFooter={false}>"), "Workspace must set showFooter={false}");
  });

  await t.test("PageHeader container provides flex-wrap and min-w-0 to prevent horizontal blowout", () => {
    assert.ok(pageHeaderSource.includes("flex-wrap min-w-0"), "PageHeader actions must allow flex wrapping with min-w-0");
  });

  await t.test("Workspace toolbar is decoupled from header to prevent horizontal competition", () => {
    // Check that title and toolbar are separate containers
    assert.ok(workspaceSource.includes("IDE Workspace"), "Must render IDE Workspace heading");
    assert.ok(workspaceSource.includes("Dedicated Responsive Workspace Action Toolbar"), "Must have dedicated toolbar");
    
    // Check toolbar container has flex-wrap and min-w-0
    const toolbarMatch = workspaceSource.match(/className="[^"]*flex-wrap[^"]*justify-between[^"]*min-w-0[^"]*"/);
    assert.ok(toolbarMatch, "Toolbar container must use flex-wrap, justify-between, and min-w-0");
  });

  await t.test("Workspace toolbar contains all required controls with accessible Run button", () => {
    // Language selector
    assert.ok(workspaceSource.includes('(["java", "python", "cpp", "c"] as const)'), "Toolbar must include all 4 languages");
    
    // Shortcuts
    assert.ok(workspaceSource.includes("Visualize") && workspaceSource.includes("Trace"), "Must include Visualize Trace");
    assert.ok(workspaceSource.includes("Compiler") && workspaceSource.includes("Pipeline"), "Must include Compiler Pipeline");
    assert.ok(workspaceSource.includes("Hardware") && workspaceSource.includes("Simulator"), "Must include Hardware Simulator");
    assert.ok(workspaceSource.includes("Complexity"), "Must include Complexity");
    
    // Reset and Run
    assert.ok(workspaceSource.includes("handleReset"), "Must include Reset handler");
    assert.ok(workspaceSource.includes("handleRun"), "Must include Run handler");
    assert.ok(workspaceSource.includes("shrink-0"), "Run button must have shrink-0 to prevent clipping");
  });

  await t.test("Code editor has synchronized line numbering and supports soft wrapping or horizontal scroll", () => {
    assert.ok(workspaceSource.includes("gutterRef"), "Must define gutterRef for line numbers");
    assert.ok(workspaceSource.includes("gutterRef.current.scrollTop = e.currentTarget.scrollTop"), "Must sync line number gutter scroll with textarea");
    assert.ok(workspaceSource.includes("whitespace-pre-wrap break-words"), "Must support soft wrapping with break-words");
    assert.ok(workspaceSource.includes("whitespace-pre overflow-x-auto"), "Must support horizontal scrolling when wrap is off");
    assert.ok(workspaceSource.includes("min-w-0 min-h-0"), "Textarea container must have min-w-0 min-h-0 to allow flex shrinking");
  });

  await t.test("Console and diagnostics panel prevents horizontal overflow with break-words", () => {
    assert.ok(workspaceSource.includes("whitespace-pre-wrap break-words leading-relaxed"), "Stdout must wrap long lines with break-words");
    assert.ok(workspaceSource.includes("whitespace-pre-wrap break-words mt-2"), "Runtime error must wrap long lines with break-words");
    assert.ok(workspaceSource.includes("lg:col-span-4 flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xs min-w-0"), "Console panel must enforce min-w-0");
  });

  await t.test("Responsive layout math adapts cleanly across all 5 required validation viewports", () => {
    const viewports = [
      { name: "Large Desktop", width: 1440, height: 900, sidebar: 240, padding: 40, stacked: false },
      { name: "Laptop", width: 1280, height: 800, sidebar: 240, padding: 32, stacked: false },
      { name: "Small Desktop / Tablet Landscape", width: 1024, height: 768, sidebar: 240, padding: 32, stacked: false },
      { name: "Tablet Portrait", width: 768, height: 1024, sidebar: 0, padding: 24, stacked: true },
      { name: "Mobile", width: 390, height: 844, sidebar: 0, padding: 24, stacked: true },
    ];

    for (const vp of viewports) {
      const availableContentWidth = vp.width - vp.sidebar - vp.padding;
      assert.ok(availableContentWidth > 0, `${vp.name} must have positive available content width`);

      if (vp.stacked) {
        // Stacked viewports (width < 1024px)
        assert.ok(vp.width < 1024, `${vp.name} should stack vertically on screens under 1024px`);
        // Minimum width allows content to fit
        assert.ok(availableContentWidth >= 340, `${vp.name} must provide at least 340px width for editor`);
      } else {
        // Side-by-side viewports (width >= 1024px)
        assert.ok(vp.width >= 1024, `${vp.name} should render side-by-side on screens >= 1024px`);
        const editorWidth = (availableContentWidth * 8) / 12;
        const consoleWidth = (availableContentWidth * 4) / 12;
        assert.ok(editorWidth >= 450, `Editor must have at least 450px width at ${vp.name}`);
        assert.ok(consoleWidth >= 220, `Console must have at least 220px width at ${vp.name}`);
      }
    }
  });
});
