package com.example.time_management_system.repository;

import com.example.time_management_system.entity.Timesheet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {
    List<Timesheet> findByUserId(Long userId);
    List<Timesheet> findByStatus(Timesheet.Status status);
}
