package com.example.demo.dto.response;

import com.example.demo.entity.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class AppointmentResponse {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String departmentName;
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private String prescriptionNotes;
    private LocalDateTime createdAt;
}
