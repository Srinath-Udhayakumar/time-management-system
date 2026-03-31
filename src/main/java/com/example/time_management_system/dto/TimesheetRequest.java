package com.example.time_management_system.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TimesheetRequest {

    @NotNull
    private Long userId;

    @NotNull
    private Long projectId;

    @NotNull
    private LocalDate date;

    @NotNull
    @Min(1)
    @Max(24)
    private Integer hours;
}
