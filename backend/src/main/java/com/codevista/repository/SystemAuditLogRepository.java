package com.codevista.repository;

import com.codevista.entity.SystemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, Long> {

    List<SystemAuditLog> findByAction(String action);

    List<SystemAuditLog> findAllByOrderByCreatedAtDesc();

    List<SystemAuditLog> findTop100ByOrderByCreatedAtDesc();
}
