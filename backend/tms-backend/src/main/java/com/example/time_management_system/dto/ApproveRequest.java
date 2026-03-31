package com.example.time_management_system.dto;

import com.example.time_management_system.entity.Timesheet;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApproveRequest {

    /**
     * Must be APPROVED or REJECTED; PENDING is not a valid action.
     * The approver identity is resolved from the JWT token, not this payload.
     */
    @NotNull
    private Timesheet.Status status;

    private String remarks;
}
