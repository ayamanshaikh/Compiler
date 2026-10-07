# CodeVista AI

> *"Don't just run your code. Understand what happens."*

[![CI](https://github.com/ayamanshaikh/Compiler/actions/workflows/ci.yml/badge.svg)](https://github.com/ayamanshaikh/Compiler/actions/workflows/ci.yml)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io)
[![Java](https://img.shields.io/badge/Java-25%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Next.js](https://img.shields.io/badge/Next.js-16%20Turbopack-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

CodeVista AI is an interactive, visual, Java-first educational programming platform designed to bridge the gap between running code and truly understanding its runtime behavior. Instead of merely serving as a basic compiler, CodeVista provides real-time JVM memory tracing, step-by-step call frame visualizations, educational diagnostic guidance, algorithmic state rendering, and structured learning paths.

---

## Key Capabilities

- **Java-First Compilation & Diagnostics**: Real-time compilation with beginner-friendly diagnostic intelligence, automated error explanations, and code fix suggestions.
- **Interactive JVM Execution Tracing**: Granular step-by-step tracing of runtime variables, call stack frames, object references, and heap mutations.
- **Algorithm & Data Structure Visualizer**: Dynamic visual representation of sorting algorithms, searching, recursion, binary trees, and graph traversals.
- **Structured Curriculum**: Progressive learning paths covering Java Fundamentals, Object-Oriented Programming, Collections, Concurrency, JDBC, and Spring Framework.
- **Hands-on Practice & Challenges**: Curated coding challenges with multi-test validation, expected vs. actual output diffs, and instant feedback.
- **Student Profile & Preferences**: Sync customizable accent themes (`emerald`, `cyan`, `indigo`, `rose`, `amber`), animation speeds, and editor density settings.
- **Admin Metrics & Telemetry**: Real-time engine health, heap consumption, compilation counters, and throughput monitoring.

---

## Architecture Overview

CodeVista AI is structured as an enterprise-grade monorepo:

```
Compiler/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI automated pipeline
├── backend/
│   ├── src/                     # Spring Boot 4 source & tests (161 automated tests)
│   ├── pom.xml                  # Maven configuration with JDK 25 LTS
│   └── Dockerfile               # Multi-stage container runtime with Temurin JDK 25
├── frontend/
│   ├── src/                     # Next.js 16 App Router UI, components & hooks
│   ├── package.json             # React 19, Tailwind CSS, Monaco Editor
│   └── Dockerfile               # Multi-stage standalone Alpine container
├── docker-compose.yml           # Production multi-container orchestration
├── docker-compose.dev.yml       # Local development compose override
├── ARCHITECTURE.md              # Technical architecture and architectural diagrams
├── DEPLOYMENT.md                # Production deployment and operation runbook
├── CONTRIBUTING.md              # Contributor guidelines and standards
├── README.md                    # Project overview and quickstart
└── .env.example                 # Environment variable template
```

---

## Quickstart with Docker Compose

Deploy the entire CodeVista AI stack (PostgreSQL 16, Spring Boot backend, and Next.js frontend) with a single command:

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

---

## Local Development Setup

### Prerequisites
- **Java**: JDK 25 LTS (Eclipse Temurin)
- **Node.js**: Node 20+ or 22+ (`node --version`)
- **Git**: 2.30+

### Backend Setup
```bash
cd backend
./mvnw clean test          # Run all 161 automated unit and integration tests
./mvnw spring-boot:run     # Start backend service at http://localhost:8080
```

### Frontend Setup
```bash
cd frontend
npm install
npm run lint               # Run ESLint quality checks
npm run build              # Turbopack production compilation
npm run dev                # Start Next.js development server at http://localhost:3000
```

---

## Testing & Quality Assurance

- **Backend**: 161 automated unit, integration, and security tests covering compilation, trace engine, topics, challenges, user profiles, authentication, RBAC authorization, and HTTP security headers.
  ```bash
  ./backend/mvnw clean test -f backend/pom.xml
  ```
- **Frontend**: Zero ESLint errors/warnings and successful Turbopack production compilation.
  ```bash
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```

---

## Production Guides

- [DEPLOYMENT.md](DEPLOYMENT.md) — Production architecture, Nginx TLS proxying, container sandboxing, and backup runbooks.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution workflows, coding conventions, and pull request checklist.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Technical architecture design and system components.

---

## License

This project is licensed under the MIT License.
