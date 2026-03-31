package com.example.time_management_system.controller;

import com.example.time_management_system.dto.ApproveRequest;
import com.example.time_management_system.dto.TimesheetRequest;
import com.example.time_management_system.dto.TimesheetResponse;
import com.example.time_management_system.entity.Timesheet;
import com.example.time_management_system.service.TimesheetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
@Tag(name = "Timesheets", description = "Timesheet submission and approval — JWT token required")
@SecurityRequirement(name = "bearerAuth")
public class TimesheetController {

    private final TimesheetService timesheetService;

    @Operation(summary = "Submit a timesheet",
               description = "Authenticated user submits a timesheet. Date defaults to today if omitted.")
    @PostMapping
    public ResponseEntity<TimesheetResponse> submit(
            @Valid @RequestBody TimesheetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(timesheetService.submit(userDetails.getUsername(), request));
    }

    @Operation(summary = "Get my timesheets",
               description = "Returns timesheets for the authenticated user. Optional filters: month, year, status.")
    @GetMapping("/my")
    public ResponseEntity<List<TimesheetResponse>> getMyTimesheets(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Timesheet.Status status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                timesheetService.getMyTimesheets(userDetails.getUsername(), month, year, status));
    }

    @Operation(summary = "Get pending timesheets",
               description = "Manager view: returns timesheets awaiting approval. Optional filters: employeeName, date.")
    @GetMapping("/pending")
    public ResponseEntity<List<TimesheetResponse>> getPending(
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(timesheetService.getPending(employeeName, date));
    }

    @Operation(summary = "Get all timesheets",
               description = "Manager view: returns all timesheets with optional filters: employeeName, date, status.")
    @GetMapping("/all")
    public ResponseEntity<List<TimesheetResponse>> getAll(
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Timesheet.Status status) {
        return ResponseEntity.ok(timesheetService.getAllFiltered(employeeName, date, status));
    }

    @Operation(summary = "Get approval history",
               description = "Returns all timesheets approved or rejected by the given manager ID.")
    @GetMapping("/approved-by/{managerId}")
    public ResponseEntity<List<TimesheetResponse>> getApprovedBy(@PathVariable Long managerId) {
        return ResponseEntity.ok(timesheetService.getApprovedByManager(managerId));
    }

    @Operation(summary = "Approve or reject a timesheet",
               description = "Authenticated manager approves or rejects a specific timesheet entry.")
    @PostMapping("/{id}/approve")
    public ResponseEntity<TimesheetResponse> approve(
            @PathVariable Long id,
            @Valid @RequestBody ApproveRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(timesheetService.approve(id, request, userDetails.getUsername()));
    }
}
