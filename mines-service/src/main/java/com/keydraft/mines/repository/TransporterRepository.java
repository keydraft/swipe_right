package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Transporter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransporterRepository extends JpaRepository<Transporter, UUID>, JpaSpecificationExecutor<Transporter> {
    boolean existsByiCode(String iCode);
    
    @Query("SELECT t FROM Transporter t ORDER BY t.iCode DESC LIMIT 1")
    Optional<Transporter> findTopByOrderByiCodeDesc();
}
