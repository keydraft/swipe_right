package com.keydraft.mines.service;

import com.keydraft.mines.dto.LoginRequest;
import com.keydraft.mines.entity.Role;
import com.keydraft.mines.entity.User;
import com.keydraft.mines.repository.RoleRepository;
import com.keydraft.mines.repository.UserRepository;
import com.keydraft.mines.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.stream.Collectors;
import com.keydraft.mines.entity.Permission;
import com.keydraft.mines.dto.UserResponse;
import com.keydraft.mines.repository.UserCompanyRepository;
import java.util.List;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    public record AuthResult(String token, String username, String role, Set<String> permissions, boolean resetRequired, List<UserResponse.UserCompanyInfo> companies) {}

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserCompanyRepository userCompanyRepository;

    public AuthResult registerAdmin(String username, String password) {
        if (userRepository.existsByRoleName("ADMIN")) {
            throw new RuntimeException("System already has an administrator. Only one admin is allowed.");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").rank(0).build()));

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(adminRole)
                .enabled(true)
                .passwordResetRequired(false) // Initial admin sets their own password
                .build();

        userRepository.save(user);

        var jwtToken = jwtUtils.generateToken(user);
        Set<String> permissions = user.getRole().getPermissions().stream().map(Permission::getName).collect(Collectors.toSet());
        return new AuthResult(jwtToken, user.getUsername(), user.getRole().getName(), permissions, user.isPasswordResetRequired(), Collections.emptyList());
    }

    public AuthResult login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow();

        var jwtToken = jwtUtils.generateToken(user);
        Set<String> permissions = user.getRole().getPermissions().stream().map(Permission::getName).collect(Collectors.toSet());

        List<UserResponse.UserCompanyInfo> companies = userCompanyRepository.findByUser(user)
                .stream()
                .map(uc -> UserResponse.UserCompanyInfo.builder()
                        .companyId(uc.getCompany().getId())
                        .companyName(uc.getCompany().getName())
                        .branchId(uc.getBranch() != null ? uc.getBranch().getId() : null)
                        .branchName(uc.getBranch() != null ? uc.getBranch().getName() : null)
                        .build())
                .collect(Collectors.toList());

        return new AuthResult(jwtToken, user.getUsername(), user.getRole().getName(), permissions, user.isPasswordResetRequired(), companies);
    }
}
