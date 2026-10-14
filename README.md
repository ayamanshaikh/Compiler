# CodeVista AI — Adaptive Code Visualization, Compiler Intelligence & Systems Simulation Platform

> *"Don't just run your code. Understand what happens — from source syntax to compiler bytecode, processor state, and asymptotic complexity."*

[![CI](https://github.com/ayamanshaikh/Compiler/actions/workflows/ci.yml/badge.svg)](https://github.com/ayamanshaikh/Compiler/actions/workflows/ci.yml)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io)
[![Java](https://img.shields.io/badge/Java-25%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Next.js](https://img.shields.io/badge/Next.js-16%20Turbopack-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

CodeVista AI is an interactive, multi-language code-comprehension and computer-systems visualization platform designed to bridge the chasm between writing source code and deeply understanding its physical execution. Instead of mere decorative animations or synthetic mock data, CodeVista provides authentic compiler pipeline inspection, step-by-step JVM and hardware simulation, mathematical asymptotic complexity analysis, and guided pedagogical debugging across **Java**, **Python**, **C++**, and **C**.

---

## 🚀 Key Capabilities

### 1. Adaptive Visualization Engine (12 Specialized Concept Renderers)
- Dynamic prioritized decision matrix selecting the optimal visual presentation:
  - **Exception Flow** (`EXCEPTION`, Priority 120): Unhandled exception propagation, stack unwinding, and type hierarchy.
  - **2D Matrix Grid** (`MATRIX_2D`, Priority 110): Row/column cell coordination, grid bounds, and traversal path highlighting.
  - **Array Operations & Swaps** (`ARRAY_OPERATION`, Priority 105): In-place element exchanges, sort partitioning, and index tracking.
  - **Dynamic Collections** (`COLLECTION`, Priority 104): ArrayList dynamic growth, ghost capacity allocation, and buffer expansion.
  - **1D Array Mutations** (`ARRAY`, Priority 100): Index mutation, bounds checking, and element coloring.
  - **Relational Comparisons** (`COMPARISON`, Priority 92): Branch condition evaluation, boolean true/false gates.
  - **Recursion & Call Stack** (`RECURSION`, Priority 85): Active frame stack depth, base case termination, and return bubbling.
  - **String Operations** (`STRING_OPERATION`, Priority 78): Character array inspection and index indexing.
  - **Object Instances** (`OBJECT`, Priority 70): HotSpot heap allocations, reference pointer links, and instance fields.
  - **Binary Expressions** (`EXPRESSION`, Priority 60): Arithmetic operator trees and operator precedence.
  - **Scalar Variables** (`VARIABLE`, Priority 50): Primitive assignments and scope updates.
  - **Pedagogical Explanation Fallback** (`EXPLANATION_FALLBACK`, Priority 0): Zero-fake-data fallback with Beginner and Detailed conceptual walkthroughs for non-visual code lines.

### 2. Authentic 5-Stage OpenJDK Compiler Pipeline
- Direct, genuine compiler inspection powered by OpenJDK `javac` and `javap`:
  - **Stage 1 (Source)**: Syntax line tracking and active statement highlighting.
  - **Stage 2 (Lexer)**: OpenJDK javac token stream (`tokenTag`, line, column, text).
  - **Stage 3 (Parser & AST)**: Authentic `JCTree` syntax tree hierarchy (`JCCompilationUnit`, `JCClassDecl`, `JCMethodDecl`, `JCBinary`, etc.).
  - **Stage 4 (Symbols)**: Semantic symbol table resolution with scopes and type signatures.
  - **Stage 5 (Bytecode)**: Authentic `javap` disassembly opcodes (`iconst`, `istore`, `iload`, `iadd`, `invokespecial`, `return`).
- **Compiler Halting Diagnostics**: Immediate stage freezing on compile errors with line-accurate diagnostic pointers.

### 3. Computer Systems & Hardware Simulation
- **Local Variable Table (LVT)**: Dynamic slot allocation (`slot 0`, `slot 1`, ...) mapping method arguments and local variables.
- **LIFO Operand Stack**: Push/pop evaluation modeling stack top pointer (`SP`) and bytecode stack consumption.
- **ALU Status Flags**: Zero Flag (`ZF`), Sign Flag (`SF`), and Overflow Flag (`OF`) computed on arithmetic results.
- **64-bit Aligned HotSpot Heap**: Real-world object layout modeling 12-byte Mark/Klass word headers and 8-byte boundary padding.
- **CPU Registers**: Transparently models `PC`, `ACC`, `R0`, `R1`, `SP` explicitly flagged with `isConceptual: true` per Rule 2.3.

### 4. Asymptotic Time & Space Complexity Analysis
- **Static Analysis**: Algorithmic classification yielding $O(1)$, $O(n)$, $O(n^2)$, $O(\log n)$, and $O(2^n)$ bounds.
- **Best/Worst Case Asymptotics**: Detects early exit breaks to compute realistic $\Omega$ lower bounds alongside $O$ upper bounds and $\Theta$ tight bounds.
- **Memory Modeling**: Separates Auxiliary Call-Stack Space ($O(n)$ recursion depth) from Auxiliary Heap Space ($O(n)$ dynamic arrays).
- **Canonical Benchmark Curves**: Renders mathematical growth curves ($N=1..32$) overlaid with observed empirical execution steps.

### 5. Guided Error Diagnosis & Auto-Remediation
- **Compiler Diagnostics**: Detects missing semicolons, unresolved symbols, and type mismatches with instant 1-click line auto-fix.
- **Runtime Exceptions**: Explains `ArrayIndexOutOfBoundsException`, `ArithmeticException` (/ by zero), `NullPointerException`, Python `ZeroDivisionError`, and C++ segmentation faults.
- **Pedagogical Explanation**: Dual-mode explanation providing clear plain-English causation for beginners and low-level runtime safety context for advanced learners.

### 6. Multi-Language Extensibility & 16 Presets
- Unified adapter architecture supporting:
  - **Java**: Full OpenJDK 25 JVM execution tracing.
  - **Python**: CPython 3.12 dynamic type evaluation, list comprehensions, and traceback diagnostics.
  - **C++**: Native address space, pointer dereferencing, and GCC/Clang diagnostic parsing.
  - **C**: Procedural execution, struct records, and stack/heap memory models.
- **16 Curated Presets**: Filterable by language and concept across Variables, Loops, Arrays, Recursion, Objects, Matrix, and Pointers.

### 7. Accessibility, Performance & UX Polish
- **Screen Reader Support**: Complete ARIA live step announcer (`TraceAriaLiveAnnouncer`) announcing state changes across all 12 concepts without data leaks.
- **Reduced Motion Support**: Automatic media-query detection `(prefers-reduced-motion: reduce)` and toolbar toggle providing instant transitions and auto-expanded textual narrative cards.
- **Keyboard Shortcuts**: Complete shortcut map (`Space` to play/pause, `Left`/`Right` to step, `B` to bookmark, `L` to loop, `?` for help).
- **Session Sharing & History**: Zero-server URL hash sharing (`#share=...`), JSON session export, and multi-run comparison modal.

---

## 🏛 Architecture Overview

```
Compiler/
├── backend/                     # Spring Boot 4.1.1 + Java 25 LTS
│   ├── src/                     # 174 automated unit, integration & trace tests
│   ├── pom.xml                  # Maven configuration with JDK 25 LTS
│   └── Dockerfile               # Multi-stage container runtime with Temurin JDK 25
├── frontend/                    # Next.js 16 (Turbopack) + React 19 + Tailwind CSS
│   ├── src/
│   │   ├── app/                 # Next.js App Router (11 statically optimized routes)
│   │   ├── components/          # Concept renderers, compiler pipeline, systems simulator
│   │   └── lib/visualizer/      # Adaptive strategy matrix, complexity analyzer, adapters
│   ├── scripts/                 # 162 automated pipeline, e2e & pedagogical audit tests
│   └── package.json             # TypeScript 5.7, Lucide Icons, Monaco Editor
├── docs/                        # Architecture manuals and visualizer guides
├── docker-compose.yml           # Production multi-container orchestration
└── README.md                    # Platform documentation
```

---

## ⚡ Quickstart

### Option A: Docker Compose (Full Stack)
```bash
# 1. Clone repository
git clone https://github.com/ayamanshaikh/Compiler.git
cd Compiler

# 2. Configure environment
cp .env.example .env

# 3. Launch stack
docker compose up -d --build
```
- **Frontend Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8080`
- **Health Check**: `http://localhost:8080/api/health`

### Option B: Local Development
```bash
# Backend (Terminal 1)
cd backend
./mvnw clean test          # Run all 174 automated unit & integration tests
./mvnw spring-boot:run     # Start backend service at http://localhost:8080

# Frontend (Terminal 2)
cd frontend
npm install
npm test                   # Run all 162 automated frontend tests
npm run lint               # Run ESLint quality checks (0 errors, 0 warnings)
npm run build              # Turbopack production compilation (all 11 routes clean)
npm run dev                # Start Next.js development server at http://localhost:3000
```

---

## 🧪 Testing & Verification Benchmarks

| Test Suite | Scope | Target | Result |
|:---|:---|:---:|:---:|
| **Backend Suite** | Compilation, Security, Tracing, Systems & Controllers | 174 tests | **174 / 174 PASSING** (0 failures) |
| **Frontend Suite** | Adaptive Matrix, Systems, Complexity, Remediation, A11y & Presets | 162 tests | **162 / 162 PASSING** (0 failures) |
| **TypeScript Check** | Strict static type checking (`tsc --noEmit`) | Entire UI codebase | **0 ERRORS** |
| **ESLint Quality** | Modern React 19 / Next.js 16 rules (`eslint .`) | Entire UI codebase | **0 WARNINGS, 0 ERRORS** |
| **Production Build** | Next.js 16 Turbopack production compilation | All 11 routes | **100% CLEAN GENERATION** |

---

## 📜 License

This project is licensed under the MIT License.
