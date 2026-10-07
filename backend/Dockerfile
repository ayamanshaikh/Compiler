# ==============================================================================
# CodeVista AI Backend - Multi-stage Production Dockerfile
# Base Image: Eclipse Temurin JDK 25 on Ubuntu Noble
# Note: JDK is required at runtime for the in-memory/process Java compilation service.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package Artifact
# ------------------------------------------------------------------------------
FROM eclipse-temurin:25-jdk-noble AS builder

WORKDIR /build

# Copy Maven Wrapper and POM descriptor
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Resolve dependencies layer for Docker build caching
RUN ./mvnw dependency:go-offline -B || true

# Copy application source code and package executable fat JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal Secure Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:25-jdk-noble AS runner

LABEL maintainer="CodeVista AI Engineering <support@codevista.ai>"
LABEL description="CodeVista AI Spring Boot 4 Backend with JDK 25 Runtime"

WORKDIR /app

# Install curl for container health checks
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user and group (UID 10001)
RUN groupadd -g 10001 codevista \
    && useradd -u 10001 -g codevista -s /bin/sh -m codevista

# Copy packaged JAR from builder stage
COPY --from=builder /build/target/codevista-backend-*.jar app.jar

# Set ownership
RUN chown -R codevista:codevista /app

# Switch to non-root user
USER codevista

# Containerized JVM Optimization Flags
ENV PORT=8080
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

# Health check against CodeVista health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
