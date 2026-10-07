# CodeVista AI

> *"Don't just run your code. Understand what happens."*

CodeVista AI is a Java-first educational coding platform designed to move beyond simple code execution. Instead of acting purely as an online compiler, CodeVista provides deep execution tracing, beginner-friendly compiler error intelligence, step-by-step memory and algorithm visualization, and structured learning paths.

---

## Architecture Overview

CodeVista AI is architected as an independent monorepo:

```
codevista-ai/
├── frontend/             # Next.js, React, TypeScript, Tailwind CSS, Lucide React, React Bits
├── backend/              # Java, Spring Boot, Maven, Spring Data JPA, PostgreSQL
├── ARCHITECTURE.md       # Detailed technical architecture specification
├── README.md             # Project documentation and quickstart
└── .env.example          # Environment variables template
```

### Key Capabilities & Roadmap
- **Java-First Compilation & Diagnostics**: Real-time compilation with beginner-oriented diagnostic guidance.
- **Language Extensibility**: Language-independent compiler abstraction designed to seamlessly support Python, C, and C++ without architectural redesigns.
- **Interactive Execution Tracing**: Granular tracing of runtime variables, call frames, and memory mutations.
- **Algorithm & Code Visualization**: Visual explanations for data structures, recursion, and algorithm steps.
- **Curriculum & Hands-on Practice**: Guided modules covering core Java, Servlets, Hibernate, and SQL/PostgreSQL persistence.

---

## Getting Started

### Prerequisites
- **Java**: JDK 21+ or JDK 25 LTS
- **Node.js**: Node 20+ (with npm)
- **Database**: PostgreSQL (for production/development), H2 (in-memory, preconfigured for tests)

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```
Ensure your environment variables are configured with valid credentials for your local or production database.

### 2. Backend Setup
The backend is a Spring Boot application managed with Maven. Use the bundled Maven Wrapper:

```bash
cd backend

# Run tests (uses in-memory H2 database)
./mvnw clean test

# Build package
./mvnw clean package

# Run the backend locally
./mvnw spring-boot:run
```
For zero-config local development without a running PostgreSQL instance, activate the `local` profile:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
The backend API will be available at `http://localhost:8080`.

Verify backend health:
```bash
curl http://localhost:8080/api/health
```

### 3. Frontend Setup
The frontend is built with Next.js (App Router), React, TypeScript, and Tailwind CSS.

```bash
cd frontend

# Install dependencies
npm install

# Run type check and linting
npm run type-check
npm run lint

# Run automated tests
npm test

# Run development server
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

---

## Testing Strategy

- **Backend**:
  - `mvn test`: Runs unit and integration tests using JUnit 5, Spring Boot Test, and MockMvc against an isolated in-memory H2 database.
  - Covers application startup, health endpoints, centralized exception handling, request validation, and database operations.
- **Frontend**:
  - `npm test`: Automated component tests with Vitest and React Testing Library.
  - `npm run type-check`: Strict TypeScript type validation (`tsc --noEmit`).
  - `npm run lint`: ESLint code quality checks.

---

## Security & Secrets
- Never commit actual secrets or `.env` files to git.
- Database credentials and CORS origins are injected via environment variables.
- Stack traces are sanitized and never exposed in API error responses.
