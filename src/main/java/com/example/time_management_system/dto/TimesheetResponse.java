package com.example.time_management_system.dto;

import com.example.time_management_system.entity.Timesheet;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TimesheetResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long projectId;
    private String projectName;
    private LocalDate date;
    private Integer hours;
    private Timesheet.Status status;
    private String approvedByName;
    private String remarks;
}
