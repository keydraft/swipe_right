package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Branch;
import com.keydraft.mines.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {
    Optional<Employee> findByEmployeeCode(String employeeCode);

    List<Employee> findByBranch(Branch branch);
    long countByBranch(Branch branch);
    List<Employee> findByActiveTrue();
    Optional<Employee> findTopByOrderByEmployeeCodeDesc();
}
