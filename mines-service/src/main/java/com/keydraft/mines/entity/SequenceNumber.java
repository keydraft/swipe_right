package com.keydraft.mines.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Tracks auto-incrementing serial numbers for documents (DC, Invoice, Receipt)
 * per company + branch + document type + financial year.
 * Thread-safe via pessimistic locking in the service layer.
 */
@Entity
@Table(name = "sequence_numbers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "branch_id", "document_type", "financial_year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SequenceNumber {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "document_type", nullable = false, length = 10)
    private String documentType; // "DC", "INV", "REC"

    @Column(name = "financial_year", nullable = false, length = 7)
    private String financialYear; // e.g. "2026-27"

    @Column(name = "last_number", nullable = false)
    @Builder.Default
    private Long lastNumber = 0L;
}
