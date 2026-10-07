# Contributing to CodeVista AI

Thank you for your interest in contributing to **CodeVista AI**! CodeVista AI is an interactive, visual, Java-first educational programming platform designed to help developers and students understand what happens under the hood when code executes.

---

## 1. Code of Conduct

We are dedicated to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all issues, pull requests, and discussions.

---

## 2. Tech Stack Overview

- **Backend**: Spring Boot 4.1.1, Java 25 (LTS), Spring Data JPA, PostgreSQL / H2, Bean Validation, HikariCP.
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS, Turbopack, Lucide Icons, Monaco Editor.
- **Infrastructure**: Multi-stage Docker, Docker Compose, GitHub Actions CI.

---

## 3. Local Development Setup

### 3.1 Prerequisites
- **Java Development Kit**: JDK 25 (Eclipse Temurin recommended)
- **Node.js**: v20 or v22 LTS (`node --version`)
- **Git**: 2.30+
- **Docker & Docker Compose**: Optional for local container testing

### 3.2 Backend Setup
```bash
cd backend
./mvnw clean install -DskipTests
./mvnw spring-boot:run
```
The backend starts at `http://localhost:8080`.

To run backend automated tests:
```bash
./mvnw clean test
```

### 3.3 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend starts at `http://localhost:3000`.

To run frontend linter and production build check:
```bash
npm run lint
npm run build
```

---

## 4. Git Commit Guidelines

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope): ...` — New user-facing feature or enhancement
- `fix(scope): ...` — Bug fix
- `test(scope): ...` — Adding or updating test cases
- `docs(scope): ...` — Documentation updates
- `refactor(scope): ...` — Code improvement without changing public behavior
- `build(scope): ...` — Build tools, dependencies, or Docker configuration
- `ci(scope): ...` — CI/CD pipelines and workflow scripts
- `chore(scope): ...` — Routine maintenance or chores

---

## 5. Coding Standards

### Java / Spring Boot
- Target Java 25 modern language features (pattern matching, records, sealed types where suitable).
- Keep services stateless and transactional boundaries clearly annotated.
- Never write credentials into code or committed files; use environment variable injection.
- Validate inputs using Jakarta Validation annotations (`@Valid`, `@NotNull`, `@Size`).
- Keep unit and integration test coverage high with zero test failures.

### TypeScript / Next.js
- Use strict TypeScript; avoid `any`.
- Adhere to the App Router conventions (`app/` directory).
- Ensure all components are accessible (ARIA labels, keyboard navigation).
- Run `npm run lint` before committing; no ESLint warnings or errors allowed.

---

## 6. Pull Request Checklist

Before submitting a PR, ensure:
- [ ] Backend test suite passes (`./mvnw clean test`)
- [ ] Frontend linter passes (`npm run lint`)
- [ ] Frontend production build succeeds (`npm run build`)
- [ ] Commit history is cleanly formatted using Conventional Commits
- [ ] Documentation is updated for new features or environment variables
