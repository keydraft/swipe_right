package com.keydraft.mines.service;

import com.keydraft.mines.dto.PricingQuoteRequest;
import com.keydraft.mines.dto.PricingQuoteResponse;
import com.keydraft.mines.entity.RoutePricing;
import com.keydraft.mines.entity.SourceBasePrice;
import com.keydraft.mines.entity.TransportRate;
import com.keydraft.mines.repository.RoutePricingRepository;
import com.keydraft.mines.repository.SourceBasePriceRepository;
import com.keydraft.mines.repository.TransportRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final RoutePricingRepository routePricingRepo;
    private final SourceBasePriceRepository sourceBasePriceRepo;
    private final TransportRateRepository transportRateRepo;

    @Transactional(readOnly = true)
    public PricingQuoteResponse calculateQuote(PricingQuoteRequest request) {
        
        // 1. Check for hyper-specific route overrides first
        Optional<RoutePricing> override = routePricingRepo
            .findByFromSourceIdAndToDestinationIdAndProductId(
                request.getSourceBranchId(), 
                request.getDestinationSiteId(), 
                request.getProductId()
            );

        if (override.isPresent()) {
            return PricingQuoteResponse.builder()
                .sourceBranchId(request.getSourceBranchId())
                .destinationSiteId(request.getDestinationSiteId())
                .productId(request.getProductId())
                .baseRate(BigDecimal.ZERO)
                .transportRate(BigDecimal.ZERO)
                .finalPerUnitRate(override.get().getFinalTotalRate())
                .appliedStrategy("ROUTE_OVERRIDE_APPLIED")
                .build();
        }

        // 2. Fetch base product price from the production source
        SourceBasePrice basePrice = sourceBasePriceRepo
            .findBySourceSiteIdAndProductId(request.getSourceBranchId(), request.getProductId())
            .orElseThrow(() -> new RuntimeException("Product implies no base price at this source."));

        // 3. Fetch transport logistics cost for this route
        TransportRate transport = transportRateRepo
            .findByFromSourceIdAndToDestinationId(request.getSourceBranchId(), request.getDestinationSiteId())
            .orElseThrow(() -> new RuntimeException("No transport route defined between these sites."));

        // 4. Waterfall calculation fallback
        BigDecimal finalRate = basePrice.getBaseRate().add(transport.getTransportRate());

        return PricingQuoteResponse.builder()
            .sourceBranchId(request.getSourceBranchId())
            .destinationSiteId(request.getDestinationSiteId())
            .productId(request.getProductId())
            .baseRate(basePrice.getBaseRate())
            .transportRate(transport.getTransportRate())
            .finalPerUnitRate(finalRate)
            .appliedStrategy("STANDARD_BASE_PLUS_TRANSPORT")
            .build();
    }
}
