package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Branch;
import com.keydraft.mines.entity.Employee;
import com.keydraft.mines.entity.EmployeeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeAssignmentRepository extends JpaRepository<EmployeeAssignment, UUID>, JpaSpecificationExecutor<EmployeeAssignment> {
    List<EmployeeAssignment> findByEmployeeOrderByStartDateDesc(Employee employee);
    Optional<EmployeeAssignment> findByEmployeeAndCurrentTrue(Employee employee);
    List<EmployeeAssignment> findAllByBranch(Branch branch);

    @org.springframework.transaction.annotation.Transactional
    void deleteByBranchId(UUID branchId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCompanyId(UUID companyId);
}
