package com.keydraft.mines.repository;

import com.keydraft.mines.entity.DeliveryChallan;
import com.keydraft.mines.entity.enums.DcStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface DeliveryChallanRepository extends JpaRepository<DeliveryChallan, UUID>,
        JpaSpecificationExecutor<DeliveryChallan> {

    // ─── POS Pay Later: find unpaid DCs ─────────────────────
    List<DeliveryChallan> findByVehicleNoAndStatusOrderByDcDateDesc(String vehicleNo, DcStatus status);

    List<DeliveryChallan> findByCustomerIdAndStatusOrderByDcDateDesc(UUID customerId, DcStatus status);

    List<DeliveryChallan> findByGuestNameContainingIgnoreCaseAndStatusOrderByDcDateDesc(String guestName, DcStatus status);

    // ─── Outstanding check: does this vehicle have unpaid bills? ─
    @Query("SELECT COALESCE(SUM(d.amount - d.paidAmount), 0) FROM DeliveryChallan d " +
           "WHERE d.vehicleNo = :vehicleNo AND d.status = 'UNPAID'")
    BigDecimal findOutstandingByVehicle(@Param("vehicleNo") String vehicleNo);

    // ─── Credit: find completed DCs not yet invoiced ────────
    List<DeliveryChallan> findByCustomerIdAndStatusAndSaleModeOrderByDcDateAsc(
            UUID customerId, DcStatus status, com.keydraft.mines.entity.enums.SaleMode saleMode);

    // ─── Listing with filters ───────────────────────────────
    Page<DeliveryChallan> findByCompanyIdAndBranchId(UUID companyId, UUID branchId, Pageable pageable);

    Page<DeliveryChallan> findByCompanyIdAndBranchIdAndStatus(UUID companyId, UUID branchId, DcStatus status, Pageable pageable);
}
