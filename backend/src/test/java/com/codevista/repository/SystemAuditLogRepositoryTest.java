package com.codevista.repository;

import com.codevista.entity.SystemAuditLog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class SystemAuditLogRepositoryTest {

    @Autowired
    private SystemAuditLogRepository auditLogRepository;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
    }

    @Test
    @DisplayName("Database connection and JPA repository operations work correctly with H2")
    void testSaveAndFindByAction() {
        SystemAuditLog log1 = new SystemAuditLog("STARTUP", "System initialized successfully");
        SystemAuditLog log2 = new SystemAuditLog("PING", "Health check ping processed");

        auditLogRepository.save(log1);
        auditLogRepository.save(log2);

        List<SystemAuditLog> pingLogs = auditLogRepository.findByAction("PING");

        assertThat(pingLogs).hasSize(1);
        assertThat(pingLogs.get(0).getId()).isNotNull();
        assertThat(pingLogs.get(0).getAction()).isEqualTo("PING");
        assertThat(pingLogs.get(0).getDetails()).isEqualTo("Health check ping processed");
        assertThat(pingLogs.get(0).getCreatedAt()).isNotNull();
    }
}
