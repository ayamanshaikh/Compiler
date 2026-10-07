package com.codevista.admin.service;

import com.codevista.admin.dto.AdminUserSummaryDto;
import com.codevista.admin.dto.UpdateUserRoleRequest;
import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.exception.BadRequestException;
import com.codevista.exception.ResourceNotFoundException;
import com.codevista.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public AdminUserService(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummaryDto> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminUserSummaryDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserSummaryDto updateUserRole(Long targetUserId, UpdateUserRoleRequest request, User admin) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        if (target.getId().equals(admin.getId()) && request.getRole() != UserRole.ROLE_ADMIN) {
            throw new BadRequestException("Cannot demote your own administrator account");
        }

        UserRole oldRole = target.getRole();
        target.setRole(request.getRole());
        User saved = userRepository.save(target);

        auditLogService.recordLog("USER_ROLE_UPDATED",
                String.format("Admin '%s' changed role of '%s' from %s to %s",
                        admin.getUsername(), saved.getUsername(), oldRole, saved.getRole()));

        return new AdminUserSummaryDto(saved);
    }
}
