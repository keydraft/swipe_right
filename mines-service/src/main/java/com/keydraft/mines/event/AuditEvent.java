package com.keydraft.mines.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuditEvent {
    private final String username;
    private final String action;
    private final String details;
    private final String ipAddress;
}
