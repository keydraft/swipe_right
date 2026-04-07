package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface BranchRepository extends JpaRepository<Branch, UUID> {
}
