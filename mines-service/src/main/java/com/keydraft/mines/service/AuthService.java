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

@Service
@RequiredArgsConstructor
public class AuthService {

    public record AuthResult(String token, String username, String role, boolean resetRequired) {}

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

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
        return new AuthResult(jwtToken, user.getUsername(), user.getRole().getName(), user.isPasswordResetRequired());
    }

    public AuthResult login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow();

        var jwtToken = jwtUtils.generateToken(user);

        return new AuthResult(jwtToken, user.getUsername(), user.getRole().getName(), user.isPasswordResetRequired());
    }
}
