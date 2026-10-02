package com.example.demo.service;

import com.example.demo.dto.request.AppointmentRequest;
import com.example.demo.dto.request.PrescriptionRequest;
import com.example.demo.dto.response.AppointmentResponse;
import com.example.demo.dto.response.SlotResponse;
import com.example.demo.entity.*;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ConflictException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DoctorRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public AppointmentResponse book(AppointmentRequest request) {
        UserDetailsImpl currentUser = getCurrentUser();

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + request.getDoctorId()));

        User patient = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        validateSlot(doctor, request.getAppointmentDate(), request.getStartTime(), request.getEndTime());

        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setStatus(AppointmentStatus.PENDING);

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment booked: patient={} doctor={} date={}", patient.getEmail(), doctor.getUser().getEmail(), request.getAppointmentDate());

        notificationService.send(
            doctor.getUser(),
            "New Appointment Request",
            "Patient " + patient.getName() + " has requested an appointment on " +
            request.getAppointmentDate() + " at " + request.getStartTime()
        );

        return toResponse(saved);
    }

    public List<AppointmentResponse> getMyAppointments() {
        UserDetailsImpl currentUser = getCurrentUser();
        boolean isDoctor = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));

        if (isDoctor) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctor.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
        }

        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(currentUser.getId())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AppointmentResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public List<AppointmentResponse> getAllForAdmin() {
        return appointmentRepository.findAllWithDetails().stream()
            .map(this::toResponse).collect(Collectors.toList());
    }

    public List<AppointmentResponse> getDoctorScheduleForDate(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, date)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<SlotResponse> getBookedSlots(Long doctorId, LocalDate date) {
        return appointmentRepository.findBookedSlots(doctorId, date).stream()
            .map(a -> {
                SlotResponse slot = new SlotResponse();
                slot.setStartTime(a.getStartTime());
                slot.setEndTime(a.getEndTime());
                slot.setStatus(a.getStatus().name());
                return slot;
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse cancel(Long id) {
        Appointment appointment = findOrThrow(id);
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Appointment is already cancelled");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(appointment);

        UserDetailsImpl currentUser = getCurrentUser();
        boolean cancelledByPatient = currentUser.getId().equals(appointment.getPatient().getId());
        if (cancelledByPatient) {
            notificationService.send(appointment.getDoctor().getUser(),
                "Appointment Cancelled",
                "Patient " + appointment.getPatient().getName() + " cancelled the appointment on " +
                appointment.getAppointmentDate() + " at " + appointment.getStartTime());
        } else {
            notificationService.send(appointment.getPatient(),
                "Appointment Cancelled",
                "Dr. " + appointment.getDoctor().getUser().getName() + " cancelled your appointment on " +
                appointment.getAppointmentDate() + " at " + appointment.getStartTime());
        }

        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse approve(Long id) {
        Appointment appointment = findOrThrow(id);
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BadRequestException("Only pending appointments can be approved");
        }
        appointment.setStatus(AppointmentStatus.APPROVED);
        Appointment saved = appointmentRepository.save(appointment);

        notificationService.send(appointment.getPatient(),
            "Appointment Approved",
            "Your appointment with Dr. " + appointment.getDoctor().getUser().getName() +
            " on " + appointment.getAppointmentDate() + " at " + appointment.getStartTime() + " has been approved.");

        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse complete(Long id, PrescriptionRequest prescription) {
        Appointment appointment = findOrThrow(id);
        if (appointment.getStatus() != AppointmentStatus.APPROVED) {
            throw new BadRequestException("Only approved appointments can be marked as completed");
        }

        LocalDate today = LocalDate.now();
        if (appointment.getAppointmentDate().isAfter(today)) {
            throw new BadRequestException("Cannot complete future appointments. Doctors can only complete today's appointments.");
        }
        if (!appointment.getAppointmentDate().isEqual(today)) {
            throw new BadRequestException("Doctors can only complete appointments scheduled for today.");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        if (prescription != null && prescription.getPrescriptionNotes() != null) {
            appointment.setPrescriptionNotes(prescription.getPrescriptionNotes());
        }
        Appointment saved = appointmentRepository.save(appointment);

        notificationService.send(appointment.getPatient(),
            "Appointment Completed",
            "Your appointment with Dr. " + appointment.getDoctor().getUser().getName() +
            " on " + appointment.getAppointmentDate() + " has been completed. Check your prescription notes.");

        return toResponse(saved);
    }


    private void validateSlot(Doctor doctor, LocalDate date, LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("End time must be after start time");
        }
        long durationMinutes = Duration.between(start, end).toMinutes();
        if (durationMinutes < 15) {
            throw new BadRequestException("Appointment slot must be at least 15 minutes");
        }
        if (durationMinutes > 60) {
            throw new BadRequestException("Appointment duration cannot exceed 1 hour (60 minutes)");
        }
        if (!date.isAfter(LocalDate.now())) {
            throw new BadRequestException("Same-day or past appointments are not allowed. Please select a date from tomorrow onwards.");
        }
        if (start.isBefore(doctor.getStartTime()) || end.isAfter(doctor.getEndTime())) {
            throw new BadRequestException(
                "Slot must be within doctor's working hours (" +
                doctor.getStartTime() + " – " + doctor.getEndTime() + ")"
            );
        }
        if (doctor.getBreakTime() != null && doctor.getBreakEndTime() != null) {
            boolean overlapBreak = start.isBefore(doctor.getBreakEndTime()) && end.isAfter(doctor.getBreakTime());
            if (overlapBreak) {
                throw new BadRequestException(
                    "Slot overlaps with doctor's break (" +
                    doctor.getBreakTime() + " – " + doctor.getBreakEndTime() + ")"
                );
            }
        }

        List<Appointment> conflicts = appointmentRepository.findConflicting(doctor.getId(), date, start, end);
        if (!conflicts.isEmpty()) {
            throw new ConflictException("This time slot overlaps with an existing appointment");
        }
    }

    private Appointment findOrThrow(Long id) {
        return appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private AppointmentResponse toResponse(Appointment a) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(a.getId());
        response.setDoctorId(a.getDoctor().getId());
        response.setDoctorName(a.getDoctor().getUser().getName());
        response.setDoctorSpecialization(a.getDoctor().getSpecialization());
        response.setDepartmentName(a.getDoctor().getDepartment().getDepartmentName());
        response.setPatientId(a.getPatient().getId());
        response.setPatientName(a.getPatient().getName());
        response.setPatientEmail(a.getPatient().getEmail());
        response.setAppointmentDate(a.getAppointmentDate());
        response.setStartTime(a.getStartTime());
        response.setEndTime(a.getEndTime());
        response.setStatus(a.getStatus());
        response.setPrescriptionNotes(a.getPrescriptionNotes());
        response.setCreatedAt(a.getCreatedAt());
        return response;
    }
}
