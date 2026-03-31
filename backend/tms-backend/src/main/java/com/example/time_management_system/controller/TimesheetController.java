package com.example.time_management_system.controller;

import com.example.time_management_system.dto.ApproveRequest;
import com.example.time_management_system.dto.TimesheetRequest;
import com.example.time_management_system.dto.TimesheetResponse;
import com.example.time_management_system.service.TimesheetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
@Tag(name = "Timesheets", description = "Timesheet submission and approval — JWT token required")
@SecurityRequirement(name = "bearerAuth")
public class TimesheetController {

    private final TimesheetService timesheetService;

    @Operation(summary = "Submit a timesheet", description = "Employee submits a new timesheet entry")
    @PostMapping
    public ResponseEntity<TimesheetResponse> submit(@Valid @RequestBody TimesheetRequest request) {
        return ResponseEntity.ok(timesheetService.submit(request));
    }

    @Operation(summary = "Get my timesheets", description = "Returns all timesheets for a given user ID")
    @GetMapping("/my/{userId}")
    public ResponseEntity<List<TimesheetResponse>> getMyTimesheets(@PathVariable Long userId) {
        return ResponseEntity.ok(timesheetService.getByUser(userId));
    }

    @Operation(summary = "Get pending timesheets", description = "Manager-facing: returns all timesheets awaiting approval")
    @GetMapping("/pending")
    public ResponseEntity<List<TimesheetResponse>> getPending() {
        return ResponseEntity.ok(timesheetService.getPending());
    }

    @Operation(summary = "Approve or reject a timesheet", description = "Manager approves or rejects a specific timesheet entry")
    @PostMapping("/{id}/approve")
    public ResponseEntity<TimesheetResponse> approve(@PathVariable Long id,
                                                     @Valid @RequestBody ApproveRequest request) {
        return ResponseEntity.ok(timesheetService.approve(id, request));
    }
}
