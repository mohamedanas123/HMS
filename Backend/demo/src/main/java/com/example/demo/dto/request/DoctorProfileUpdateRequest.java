package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileUpdateRequest {

    @NotBlank(message = "Name cannot be empty")
    private String name;

    @jakarta.validation.constraints.Pattern(regexp = "^$|^\\+?[0-9\\s\\-\\(\\)]{10,20}$", message = "Please enter a valid phone number (10 to 15 digits)")
    private String phoneNumber;

    private Integer departmentId;

    private String specialization;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private LocalTime breakTime;

    private LocalTime breakEndTime;
}
