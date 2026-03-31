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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TimesheetService {

    private final TimesheetRepository timesheetRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public TimesheetResponse submit(TimesheetRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + request.getProjectId()));

        Timesheet timesheet = Timesheet.builder()
                .user(user)
                .project(project)
                .date(request.getDate())
                .hours(request.getHours())
                .status(Timesheet.Status.PENDING)
                .build();

        return toResponse(timesheetRepository.save(timesheet));
    }

    @Transactional(readOnly = true)
    public List<TimesheetResponse> getByUser(Long userId) {
        return timesheetRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TimesheetResponse> getPending() {
        return timesheetRepository.findByStatus(Timesheet.Status.PENDING)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TimesheetResponse approve(Long id, ApproveRequest request) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timesheet not found with id: " + id));

        if (timesheet.getStatus() != Timesheet.Status.PENDING) {
            throw new RuntimeException("Timesheet is not in PENDING state");
        }

        if (request.getStatus() == Timesheet.Status.PENDING) {
            throw new RuntimeException("Invalid status: cannot set timesheet back to PENDING");
        }

        timesheet.setStatus(request.getStatus());
        timesheet.setRemarks(request.getRemarks());

        if (request.getApproverId() != null) {
            User approver = userRepository.findById(request.getApproverId())
                    .orElseThrow(() -> new RuntimeException("Approver not found with id: " + request.getApproverId()));
            timesheet.setApprovedBy(approver);
        }

        return toResponse(timesheetRepository.save(timesheet));
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
            response.setApprovedByName(timesheet.getApprovedBy().getName());
        }
        return response;
    }
}
