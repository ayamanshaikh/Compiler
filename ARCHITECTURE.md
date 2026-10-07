# CodeVista AI — System Architecture

## 1. System Vision

CodeVista AI is designed under the guiding principle:
> *"Don't just run your code. Understand what happens."*

The platform bridges code execution and conceptual understanding by combining real-time compilation, step-by-step runtime tracing, visual representations of state, and educational feedback tailored for learners.

---

## 2. High-Level Architecture

The platform follows a layered, decoupled architecture with independent frontend and backend packages:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  - Interactive Workspace & Monaco Editor                    │
│  - React Bits Visualizers & Execution Stepper               │
│  - Educational Content & Diagnostic Explanations            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  Backend (Spring Boot)                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    REST API Layer                     │  │
│  │  - /api/health                                        │  │
│  │  - Centralized Exception Handling & Request Validation│  │
│  │  - Dynamic CORS Configuration                         │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                 Application Services                  │  │
│  │  - HealthService                                      │  │
│  │  - CompilerService                                    │  │
│  │  - ExecutionService (Planned)                         │  │
│  │  - VisualizationService (Planned)                     │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                 Core Domain Engines                   │  │
│  │  - Language-Independent Compiler Abstraction          │  │
│  │  - Secure Sandboxed Runner                            │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                 Persistence Layer                     │  │
│  │  - Spring Data JPA Repositories                       │  │
│  │  - PostgreSQL (Production / Dev)                      │  │
│  │  - H2 Database (In-Memory for Tests / Local Dev)      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Extensible Compiler Abstraction Design

A fundamental architectural requirement is allowing future support for languages such as **Python**, **C**, and **C++** without refactoring the core execution or API layers.

The domain establishes a language-independent contract:

```
               ┌──────────────────────────────┐
               │    <<interface>>             │
               │   LanguageCompiler           │
               ├──────────────────────────────┤
               │ + getSupportedLanguage()     │
               │ + compile(req): CompResult   │
               └──────────────▲───────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐
│JavaCompiler │        │PythonRunner │        │  C/CppComp  │
│(Implemented)│        │  (Planned)  │        │  (Planned)  │
└─────────────┘        └─────────────┘        └─────────────┘
```

### Compiler Domain Contract
- **`Language`**: Enumeration representing supported runtimes (`JAVA`, `PYTHON`, `C`, `CPP`).
- **`LanguageCompiler`**: The common interface implemented by language-specific toolchains.
- **`CompilerService`**: Resolves the appropriate `LanguageCompiler` dynamically based on the requested language.
- **`CompilationResult`**: Standardized response encapsulating success status, compiled artifacts, and structured diagnostic items (line, column, error category, message).

---

## 4. API & Error Architecture

All endpoints reside under the `/api/...` namespace.

### Structured Error Responses
All uncaught exceptions and validation failures are intercepted by `GlobalExceptionHandler` (`@RestControllerAdvice`) and transformed into a standardized, predictable format:

```json
{
  "timestamp": "2026-09-21T15:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for request",
  "path": "/api/health/ping",
  "validationErrors": [
    {
      "field": "message",
      "message": "Message must not be blank",
      "rejectedValue": ""
    }
  ]
}
```

Internal Java stack traces are strictly filtered from HTTP responses and logged internally via SLF4J to prevent information disclosure.

---

## 5. Security & Configuration Architecture

- **Environment-Driven Configuration**: PostgreSQL host, port, database, credentials, and server ports are provided strictly via environment variables (`SPRING_DATASOURCE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- **Resilient Connection Pooling**: HikariCP is configured with `initialization-fail-timeout=0` to ensure graceful startup behavior.
- **Dynamic CORS**: Allowed origins are managed through the `CORS_ALLOWED_ORIGINS` environment variable, avoiding hardcoded localhost origins.
