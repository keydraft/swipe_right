package com.keydraft.mines.entity;

import com.keydraft.mines.entity.enums.BranchType;
import com.keydraft.mines.entity.enums.SiteType;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "branches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SiteType siteType;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BranchType branchType;

    @Column(nullable = false)
    private String name;

    private String phone; // Contact info for branch
    private String alternatePhoneNo;
    private String emailId;

    @Embedded
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

}
