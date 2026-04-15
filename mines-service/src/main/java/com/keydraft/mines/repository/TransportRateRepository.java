package com.keydraft.mines.repository;

import com.keydraft.mines.entity.TransportRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransportRateRepository extends JpaRepository<TransportRate, UUID> {
    Optional<TransportRate> findByFromSourceIdAndToDestinationId(UUID fromSourceId, UUID toDestinationId);
}
