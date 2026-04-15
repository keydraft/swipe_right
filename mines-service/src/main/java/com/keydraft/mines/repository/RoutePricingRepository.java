package com.keydraft.mines.repository;

import com.keydraft.mines.entity.RoutePricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoutePricingRepository extends JpaRepository<RoutePricing, UUID> {
    Optional<RoutePricing> findByFromSourceIdAndToDestinationIdAndProductId(UUID fromSourceId, UUID toDestinationId, UUID productId);
}
