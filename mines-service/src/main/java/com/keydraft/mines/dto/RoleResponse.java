package com.keydraft.mines.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response containing role information with audit details")
public class RoleResponse {
    
    @Schema(description = "Unique ID of the role", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Name of the role", example = "MANAGER")
    private String name;
    private Integer rank;

    @Schema(description = "Timestamp when the role was created")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the role was last updated")
    private LocalDateTime updatedAt;

    @Schema(description = "User who created this role")
    private String createdBy;

    @Schema(description = "User who last updated this role")
    private String updatedBy;
}
