package com.codevista.service;

import com.codevista.dto.AuthResponse;
import com.codevista.dto.LoginRequest;
import com.codevista.dto.RegisterRequest;
import com.codevista.dto.UserSummaryDto;
import com.codevista.entity.User;
import com.codevista.entity.UserPreferences;
import com.codevista.entity.UserProgress;
import com.codevista.entity.UserRole;
import com.codevista.exception.BadRequestException;
import com.codevista.exception.ForbiddenException;
import com.codevista.exception.UnauthorizedException;
import com.codevista.repository.UserRepository;
import com.codevista.security.JwtTokenService;
import com.codevista.security.PasswordService;
import com.codevista.security.TokenClaims;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final JwtTokenService jwtTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordService passwordService,
            JwtTokenService jwtTokenService
    ) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username '" + username + "' is already registered");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email '" + email + "' is already registered");
        }

        String passwordHash = passwordService.hashPassword(request.getPassword());
        User user = new User(username, email, passwordHash, UserRole.ROLE_STUDENT);

        UserPreferences preferences = new UserPreferences(user);
        user.setPreferences(preferences);

        UserProgress progress = new UserProgress(user);
        progress.setLastActiveAt(Instant.now());
        user.setProgress(progress);

        User savedUser = userRepository.save(user);

        String token = jwtTokenService.generateToken(savedUser);
        UserSummaryDto summary = toSummaryDto(savedUser);

        return AuthResponse.of(token, jwtTokenService.getExpirationSeconds(), summary);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim().toLowerCase();

        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials: user not found"));

        if (!passwordService.verifyPassword(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials: password incorrect");
        }

        if (user.getProgress() != null) {
            user.getProgress().setLastActiveAt(Instant.now());
        }

        String token = jwtTokenService.generateToken(user);
        UserSummaryDto summary = toSummaryDto(user);

        return AuthResponse.of(token, jwtTokenService.getExpirationSeconds(), summary);
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String authorizationHeader) {
        String token = jwtTokenService.extractToken(authorizationHeader);
        if (token == null) {
            throw new UnauthorizedException("Authentication required: missing Bearer token");
        }

        TokenClaims claims = jwtTokenService.validateAndParseToken(token);
        return userRepository.findById(claims.userId())
                .orElseThrow(() -> new UnauthorizedException("User account not found"));
    }

    @Transactional(readOnly = true)
    public Optional<User> resolveOptionalUser(String authorizationHeader) {
        String token = jwtTokenService.extractToken(authorizationHeader);
        if (token == null) {
            return Optional.empty();
        }

        try {
            TokenClaims claims = jwtTokenService.validateAndParseToken(token);
            return userRepository.findById(claims.userId());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public UserSummaryDto toSummaryDto(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public User requireAdminOrInstructor(String authorizationHeader) {
        User user = getCurrentUser(authorizationHeader);
        if (user.getRole() != UserRole.ROLE_ADMIN && user.getRole() != UserRole.ROLE_INSTRUCTOR) {
            throw new ForbiddenException("Access denied: Administrative privileges required");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public User requireAdmin(String authorizationHeader) {
        User user = getCurrentUser(authorizationHeader);
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            throw new ForbiddenException("Access denied: Super-admin privileges required");
        }
        return user;
    }
}
