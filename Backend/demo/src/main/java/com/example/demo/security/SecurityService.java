package com.example.demo.security;

import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DoctorRepository;
import com.example.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service("securityService")
@Transactional(readOnly = true)
public class SecurityService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public boolean isPatientOfAppointment(Long appointmentId) {
        Long currentUserId = getCurrentUserId();
        return appointmentRepository.findById(appointmentId)
            .map(a -> a.getPatient().getId().equals(currentUserId))
            .orElse(false);
    }

    public boolean isDoctorOfAppointment(Long appointmentId) {
        Long currentUserId = getCurrentUserId();
        return appointmentRepository.findById(appointmentId)
            .map(a -> a.getDoctor().getUser().getId().equals(currentUserId))
            .orElse(false);
    }

    public boolean isDoctorProfile(Long doctorId) {
        Long currentUserId = getCurrentUserId();
        return doctorRepository.findById(doctorId)
            .map(d -> d.getUser().getId().equals(currentUserId))
            .orElse(false);
    }

    public boolean isNotificationOwner(Long notificationId) {
        Long currentUserId = getCurrentUserId();
        return notificationRepository.findById(notificationId)
            .map(n -> n.getUser().getId().equals(currentUserId))
            .orElse(false);
    }

    public boolean isCurrentUser(Long userId) {
        Long currentUserId = getCurrentUserId();
        return currentUserId != null && currentUserId.equals(userId);
    }

    private Long getCurrentUserId() {
        UserDetailsImpl principal = (UserDetailsImpl) SecurityContextHolder
            .getContext().getAuthentication().getPrincipal();
        return principal.getId();
    }
}
