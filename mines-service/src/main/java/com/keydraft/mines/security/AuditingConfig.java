package com.keydraft.mines.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAwareImpl")
@EnableAsync
public class AuditingConfig {
}
