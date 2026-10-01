package com.example.demo.controller;

import com.example.demo.dto.request.AppointmentRequest;
import com.example.demo.dto.request.PrescriptionRequest;
import com.example.demo.dto.response.AppointmentResponse;
import com.example.demo.dto.response.SlotResponse;
import com.example.demo.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.book(request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
        return ResponseEntity.ok(appointmentService.getMyAppointments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isPatientOfAppointment(#id) or @securityService.isDoctorOfAppointment(#id)")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getAll() {
        return ResponseEntity.ok(appointmentService.getAllForAdmin());
    }

    @GetMapping("/doctor/{doctorId}/date/{date}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getDoctorSchedule(
            @PathVariable Long doctorId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getDoctorScheduleForDate(doctorId, date));
    }

    @GetMapping("/slots/{doctorId}")
    public ResponseEntity<List<SlotResponse>> getBookedSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getBookedSlots(doctorId, date));
    }


    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isPatientOfAppointment(#id) or @securityService.isDoctorOfAppointment(#id)")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancel(id));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("@securityService.isDoctorOfAppointment(#id)")
    public ResponseEntity<AppointmentResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.approve(id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("@securityService.isDoctorOfAppointment(#id)")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable Long id,
                                                        @RequestBody(required = false) PrescriptionRequest prescription) {
        return ResponseEntity.ok(appointmentService.complete(id, prescription));
    }
}
