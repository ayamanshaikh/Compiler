package com.codevista.service;

import com.codevista.dto.HealthResponse;
import com.codevista.dto.PingRequest;
import com.codevista.dto.PingResponse;
import com.codevista.entity.SystemAuditLog;
import com.codevista.repository.SystemAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Arrays;

@Service
public class HealthService {

    private static final Logger log = LoggerFactory.getLogger(HealthService.class);
    private static final String SERVICE_NAME = "CodeVista AI Backend";
    private static final String VERSION = "0.1.0";

    private final Environment environment;
    private final SystemAuditLogRepository auditLogRepository;

    public HealthService(Environment environment, SystemAuditLogRepository auditLogRepository) {
        this.environment = environment;
        this.auditLogRepository = auditLogRepository;
    }

    public HealthResponse getHealthStatus() {
        String[] activeProfiles = environment.getActiveProfiles();
        String env = (activeProfiles != null && activeProfiles.length > 0)
                ? String.join(",", activeProfiles)
                : "default";

        log.debug("Health status requested in environment: {}", env);

        return new HealthResponse(
                "UP",
                SERVICE_NAME,
                VERSION,
                Instant.now(),
                env
        );
    }

    public PingResponse processPing(PingRequest request) {
        log.info("Processing ping with message: {}", request.message());

        // Record audit trail for tracking system health interactions
        SystemAuditLog auditLog = new SystemAuditLog("PING", request.message());
        auditLogRepository.save(auditLog);

        return new PingResponse(
                request.message(),
                Instant.now()
        );
    }
}
