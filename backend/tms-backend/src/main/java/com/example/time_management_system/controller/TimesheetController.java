package com.example.time_management_system.controller;

import com.example.time_management_system.dto.ApproveRequest;
import com.example.time_management_system.dto.TimesheetRequest;
import com.example.time_management_system.dto.TimesheetResponse;
import com.example.time_management_system.service.TimesheetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
public class TimesheetController {

    private final TimesheetService timesheetService;

    @PostMapping
    public ResponseEntity<TimesheetResponse> submit(@Valid @RequestBody TimesheetRequest request) {
        return ResponseEntity.ok(timesheetService.submit(request));
    }

    @GetMapping("/my/{userId}")
    public ResponseEntity<List<TimesheetResponse>> getMyTimesheets(@PathVariable Long userId) {
        return ResponseEntity.ok(timesheetService.getByUser(userId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<TimesheetResponse>> getPending() {
        return ResponseEntity.ok(timesheetService.getPending());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<TimesheetResponse> approve(@PathVariable Long id,
                                                     @Valid @RequestBody ApproveRequest request) {
        return ResponseEntity.ok(timesheetService.approve(id, request));
    }
}
