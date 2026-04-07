package com.keydraft.mines.event;

import com.keydraft.mines.entity.AuditLog;
import com.keydraft.mines.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;

    @Async
    @EventListener
    public void handleAuditEvent(AuditEvent event) {
        String ipAddress = event.getIpAddress();
        
        // Try to get IP from context if not provided
        if (ipAddress == null || ipAddress.isEmpty()) {
            try {
                ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attrs != null) {
                    HttpServletRequest request = attrs.getRequest();
                    ipAddress = request.getRemoteAddr();
                }
            } catch (Exception e) {
                ipAddress = "UNKNOWN";
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .username(event.getUsername())
                .action(event.getAction())
                .details(event.getDetails())
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);
    }
}
