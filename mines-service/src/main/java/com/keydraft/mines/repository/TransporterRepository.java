package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Transporter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TransporterRepository extends JpaRepository<Transporter, UUID>, JpaSpecificationExecutor<Transporter> {
    boolean existsByiCode(String iCode);
}
