package com.example.time_management_system.repository;

import com.example.time_management_system.entity.Timesheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {

    List<Timesheet> findByUserId(Long userId);

    boolean existsByUserIdAndDate(Long userId, LocalDate date);

    List<Timesheet> findByUserIdAndStatus(Long userId, Timesheet.Status status);

    List<Timesheet> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);

    List<Timesheet> findByUserIdAndStatusAndDateBetween(
            Long userId, Timesheet.Status status, LocalDate start, LocalDate end);

    List<Timesheet> findByApprovedById(Long approvedById);

    List<Timesheet> findByStatus(Timesheet.Status status);

    @Query("SELECT t FROM Timesheet t WHERE t.status = :status " +
           "AND (:employeeName IS NULL OR LOWER(t.user.name) LIKE LOWER(CONCAT('%', :employeeName, '%'))) " +
           "AND (:date IS NULL OR t.date = :date)")
    List<Timesheet> findByStatusWithFilters(
            @Param("status") Timesheet.Status status,
            @Param("employeeName") String employeeName,
            @Param("date") LocalDate date);

    @Query("SELECT t FROM Timesheet t WHERE " +
           "(:status IS NULL OR t.status = :status) " +
           "AND (:employeeName IS NULL OR LOWER(t.user.name) LIKE LOWER(CONCAT('%', :employeeName, '%'))) " +
           "AND (:date IS NULL OR t.date = :date)")
    List<Timesheet> findAllWithFilters(
            @Param("status") Timesheet.Status status,
            @Param("employeeName") String employeeName,
            @Param("date") LocalDate date);
}
