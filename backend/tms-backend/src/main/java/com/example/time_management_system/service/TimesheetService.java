package com.example.time_management_system.service;

import com.example.time_management_system.dto.ApproveRequest;
import com.example.time_management_system.dto.TimesheetRequest;
import com.example.time_management_system.dto.TimesheetResponse;
import com.example.time_management_system.entity.Project;
import com.example.time_management_system.entity.Timesheet;
import com.example.time_management_system.entity.User;
import com.example.time_management_system.repository.ProjectRepository;
import com.example.time_management_system.repository.TimesheetRepository;
import com.example.time_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TimesheetService {

    private final TimesheetRepository timesheetRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * Submit a timesheet for the authenticated user.
     * If date is omitted it defaults to today.
     * Duplicate entries (same user + date) are rejected.
     */
    public TimesheetResponse submit(String userEmail, TimesheetRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + request.getProjectId()));

        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();

        if (timesheetRepository.existsByUserIdAndDate(user.getId(), date)) {
            throw new RuntimeException("A timesheet entry already exists for " + date);
        }

        Timesheet timesheet = Timesheet.builder()
                .user(user)
                .project(project)
                .date(date)
                .hours(request.getHours())
                .status(Timesheet.Status.PENDING)
                .build();

        return toResponse(timesheetRepository.save(timesheet));
    }

    /**
     * Get timesheets for the authenticated user with optional filters.
     */
    @Transactional(readOnly = true)
    public List<TimesheetResponse> getMyTimesheets(String userEmail,
                                                   Integer month,
                                                   Integer year,
                                                   Timesheet.Status status) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        List<Timesheet> timesheets;

        if (month != null && year != null) {
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            if (status != null) {
                timesheets = timesheetRepository.findByUserIdAndStatusAndDateBetween(
                        user.getId(), status, start, end);
            } else {
                timesheets = timesheetRepository.findByUserIdAndDateBetween(
                        user.getId(), start, end);
            }
        } else if (status != null) {
            timesheets = timesheetRepository.findByUserIdAndStatus(user.getId(), status);
        } else {
            timesheets = timesheetRepository.findByUserId(user.getId());
        }

        return timesheets.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Get pending timesheets (manager view) with optional filters.
     */
    @Transactional(readOnly = true)
    public List<TimesheetResponse> getPending(String employeeName, LocalDate date) {
        return timesheetRepository
                .findByStatusWithFilters(Timesheet.Status.PENDING, employeeName, date)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all timesheets (manager view) with optional filters.
     */
    @Transactional(readOnly = true)
    public List<TimesheetResponse> getAllFiltered(String employeeName,
                                                  LocalDate date,
                                                  Timesheet.Status status) {
        return timesheetRepository
                .findAllWithFilters(status, employeeName, date)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approve or reject a timesheet; the approver is the authenticated manager.
     */
    public TimesheetResponse approve(Long id, ApproveRequest request, String approverEmail) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timesheet not found with id: " + id));

        if (timesheet.getStatus() != Timesheet.Status.PENDING) {
            throw new RuntimeException("Timesheet is not in PENDING state");
        }

        if (request.getStatus() == Timesheet.Status.PENDING) {
            throw new RuntimeException("Invalid status: cannot set timesheet back to PENDING");
        }

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found: " + approverEmail));

        timesheet.setStatus(request.getStatus());
        timesheet.setRemarks(request.getRemarks());
        timesheet.setApprovedBy(approver);

        return toResponse(timesheetRepository.save(timesheet));
    }

    /**
     * Return all timesheets that were approved/rejected by the given manager.
     */
    @Transactional(readOnly = true)
    public List<TimesheetResponse> getApprovedByManager(Long managerId) {
        return timesheetRepository.findByApprovedById(managerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private TimesheetResponse toResponse(Timesheet timesheet) {
        TimesheetResponse response = new TimesheetResponse();
        response.setId(timesheet.getId());
        response.setUserId(timesheet.getUser().getId());
        response.setUserName(timesheet.getUser().getName());
        response.setProjectId(timesheet.getProject().getId());
        response.setProjectName(timesheet.getProject().getName());
        response.setDate(timesheet.getDate());
        response.setHours(timesheet.getHours());
        response.setStatus(timesheet.getStatus());
        response.setRemarks(timesheet.getRemarks());
        if (timesheet.getApprovedBy() != null) {
            response.setApprovedById(timesheet.getApprovedBy().getId());
            response.setApprovedByName(timesheet.getApprovedBy().getName());
        }
        return response;
    }
}
