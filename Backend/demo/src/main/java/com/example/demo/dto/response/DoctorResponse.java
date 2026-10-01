package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class DoctorResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phoneNumber;
    private Integer departmentId;
    private String departmentName;
    private String specialization;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalTime breakTime;
    private LocalTime breakEndTime;
}
