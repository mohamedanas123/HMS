package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class SlotResponse {
    private LocalTime startTime;
    private LocalTime endTime;
    private String patientName;  // null if you're not the patient (for doctors/admin)
    private String status;
}
