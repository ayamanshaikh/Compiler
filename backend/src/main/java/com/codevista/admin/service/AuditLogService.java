package com.codevista.admin.service;

import com.codevista.admin.dto.AdminAuditLogDto;
import com.codevista.entity.SystemAuditLog;
import com.codevista.repository.SystemAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private final SystemAuditLogRepository auditLogRepository;

    public AuditLogService(SystemAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public SystemAuditLog recordLog(String action, String details) {
        SystemAuditLog log = new SystemAuditLog(action, details);
        return auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLogDto> getRecentLogs(int limit) {
        List<SystemAuditLog> logs = auditLogRepository.findTop100ByOrderByCreatedAtDesc();
        return logs.stream()
                .limit(limit > 0 ? limit : 50)
                .map(AdminAuditLogDto::new)
                .collect(Collectors.toList());
    }
}
