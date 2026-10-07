# CodeVista AI — Production Deployment Guide

This guide describes how to deploy, configure, scale, and maintain **CodeVista AI** in production environments.

---

## 1. Architecture Topology

```
                  ┌──────────────────────────────┐
                  │   Reverse Proxy / Ingress    │
                  │   (Nginx / Caddy / Traefik)  │
                  │       HTTPS / Port 443       │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        / (Web UI, SSR)              /api/* (REST API)
                 │                               │
                 ▼                               ▼
      ┌─────────────────────┐         ┌─────────────────────┐
      │   Frontend App      │         │   Backend Engine    │
      │   Next.js 16        │         │   Spring Boot 4     │
      │   Node 22 (Alpine)  │         │   JDK 25 (Ubuntu)   │
      │   Port 3000         │         │   Port 8080         │
      └─────────────────────┘         └──────────┬──────────┘
                                                 │
                                                 ▼
                                      ┌─────────────────────┐
                                      │   PostgreSQL 16     │
                                      │   Alpine Database   │
                                      │   Port 5432         │
                                      └─────────────────────┘
```

---

## 2. System Requirements & Hardware Sizing

### Minimum (Development / Small Classroom)
- **CPU**: 2 vCPUs
- **RAM**: 4 GB (2 GB JVM heap, 1 GB Next.js, 1 GB PostgreSQL + OS)
- **Disk**: 20 GB SSD
- **OS**: Linux (Ubuntu 22.04 LTS+, Debian 12+, RHEL 9+) or Docker Desktop

### Recommended (Production / University / Team Deployment)
- **CPU**: 4+ vCPUs
- **RAM**: 8–16 GB
- **Disk**: 50+ GB NVMe SSD
- **OS**: Linux with cgroups v2 enabled for process sandboxing

---

## 3. Quickstart Deployment with Docker Compose

### 3.1 Clone Repository & Configure Environment
```bash
git clone https://github.com/ayamanshaikh/Compiler.git codevista
cd codevista

# Copy template and customize credentials
cp .env.example .env
nano .env
```

### 3.2 Launch Production Stack
```bash
docker compose up -d --build
```

### 3.3 Verify Container Status & Health
```bash
docker compose ps
```
All services (`codevista-postgres`, `codevista-backend`, and `codevista-frontend`) will show `healthy`.

---

## 4. Environment Variables Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Backend Spring Boot listening port |
| `SPRING_PROFILES_ACTIVE` | `prod` | Active Spring profile (`prod`, `dev`) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/codevista` | PostgreSQL JDBC connection URL |
| `DB_HOST` | `postgres` | Database host hostname |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `codevista` | Database name |
| `DB_USER` | `codevista` | PostgreSQL username |
| `DB_PASSWORD` | *(required)* | PostgreSQL password |
| `CORS_ALLOWED_ORIGINS` | `https://codevista.yourdomain.com` | Whitelist of allowed web origins |
| `NEXT_PUBLIC_API_URL` | `https://codevista.yourdomain.com/api` | Publicly accessible backend API URL |
| `BACKEND_PORT` | `8080` | Host port mapped to backend |
| `FRONTEND_PORT` | `3000` | Host port mapped to frontend |

---

## 5. Security & Sandbox Hardening

### 5.1 Non-Root Runtime Execution
Both production container images enforce dedicated non-root users:
- **Backend**: user `codevista` (UID `10001`, GID `10001`)
- **Frontend**: user `nextjs` (UID `1001`, GID `1001`)

### 5.2 JVM Container Quotas
The backend container is configured with container awareness flags:
```
JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"
```

### 5.3 Code Execution Sandboxing
For multi-tenant environments executing arbitrary student code:
1. Docker daemon should enforce CPU and memory limits per container:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2.0'
         memory: 2048M
   ```
2. Disable swap on the execution host.
3. Keep database credentials strictly isolated within internal Docker bridge networks (`codevista-net`), never exposing port `5432` to the public internet.

---

## 6. Reverse Proxy Configuration

### 6.1 Nginx Production Snippet
```nginx
server {
    listen 80;
    server_name codevista.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name codevista.example.com;

    ssl_certificate /etc/letsencrypt/live/codevista.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codevista.example.com/privkey.pem;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Backend API Route
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend UI Route
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 7. Health Checks & Observability

- **Application Health**: `GET /api/health`
  - Returns `{"status":"UP","timestamp":...}`
- **Metrics & Telemetry**: `GET /api/admin/metrics`
  - Requires Admin authentication (`ROLE_ADMIN` or test header).
  - Returns memory heap usage, active compilation metrics, and JVM runtime stats.

---

## 8. Backup & Maintenance

### Database Backup
```bash
docker exec -t codevista-postgres pg_dump -U codevista codevista > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i codevista-postgres psql -U codevista -d codevista
```

### Zero-Downtime Rolling Restarts
```bash
docker compose pull
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build frontend
```
