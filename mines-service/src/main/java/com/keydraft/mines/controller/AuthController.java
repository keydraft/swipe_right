package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.AuthResponse;
import com.keydraft.mines.dto.LoginRequest;
import com.keydraft.mines.entity.User;
import com.keydraft.mines.repository.UserRepository;
import com.keydraft.mines.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        setCookie(response, result.token(), 24 * 60 * 60);

        AuthResponse body = AuthResponse.builder()
                .username(result.username())
                .role(result.role())
                .permissions(result.permissions())
                .resetRequired(result.resetRequired())
                .companies(result.companies())
                .build();

        return ResponseEntity.ok(ApiResponse.success(body, "Login successful"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(ApiResponse.error(null, "Password must be at least 6 characters"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetRequired(false);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(null, "Password updated successfully"));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(@RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthService.AuthResult result = authService.registerAdmin(request.getUsername(), request.getPassword());
        setCookie(response, result.token(), 24 * 60 * 60);

        AuthResponse body = AuthResponse.builder()
                .username(result.username())
                .role(result.role())
                .permissions(result.permissions())
                .resetRequired(result.resetRequired())
                .companies(result.companies())
                .build();

        return ResponseEntity.ok(ApiResponse.success(body, "Registration successful"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        setCookie(response, null, 0);
        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
    }

    private void setCookie(HttpServletResponse response, String token, int maxAge) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true for production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }
}
