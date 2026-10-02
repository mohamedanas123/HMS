package com.example.demo.service;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.DoctorProfileUpdateRequest;
import com.example.demo.dto.request.DoctorRequest;
import com.example.demo.dto.response.DoctorResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Doctor;
import com.example.demo.entity.ERole;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.DoctorRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.ValidationUtils;

@Service
@Transactional(readOnly = true)
public class DoctorService {

    private static final Logger log = LoggerFactory.getLogger(DoctorService.class);

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<DoctorResponse> getAll() {
        return doctorRepository.findAllWithDetails().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<DoctorResponse> getByDepartment(Integer departmentId) {
        return doctorRepository.findByDepartmentId(departmentId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public DoctorResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public DoctorResponse getByCurrentUser(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userId));
        return toResponse(doctor);
    }

    @Transactional
    public DoctorResponse updateMyProfile(Long userId, DoctorProfileUpdateRequest request) {
        Doctor doctor = doctorRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userId));

        validateShiftAndBreak(request.getStartTime(), request.getEndTime(), request.getBreakTime(), request.getBreakEndTime());

        User user = doctor.getUser();
        user.setName(request.getName());

        String rawPhone = request.getPhoneNumber();
        if (rawPhone != null && !rawPhone.isBlank()) {
            if (!ValidationUtils.isValidPhoneNumber(rawPhone)) {
                throw new BadRequestException("Invalid phone number format. Must contain 10 to 15 digits.");
            }
            String cleanPhone = rawPhone.replaceAll("\\s+", "");
            if (userRepository.existsByPhoneNumberAndIdNot(cleanPhone, user.getId())) {
                throw new BadRequestException("Phone number already in use by another account: " + rawPhone);
            }
            user.setPhoneNumber(cleanPhone);
        } else {
            user.setPhoneNumber(null);
        }
        userRepository.save(user);

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));
            doctor.setDepartment(dept);
        }

        if (request.getSpecialization() != null && !request.getSpecialization().isBlank()) {
            doctor.setSpecialization(request.getSpecialization());
        }

        doctor.setStartTime(request.getStartTime());
        doctor.setEndTime(request.getEndTime());
        doctor.setBreakTime(request.getBreakTime());
        doctor.setBreakEndTime(request.getBreakEndTime());

        log.info("Doctor profile updated for user id: {}", userId);
        return toResponse(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorResponse create(DoctorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use: " + request.getEmail());
        }

        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            throw new BadRequestException("Phone number is required");
        }
        if (!ValidationUtils.isValidPhoneNumber(request.getPhoneNumber())) {
            throw new BadRequestException("Invalid phone number format. Must contain 10 to 15 digits.");
        }
        String cleanPhone = request.getPhoneNumber().replaceAll("\\s+", "");
        if (userRepository.existsByPhoneNumber(cleanPhone)) {
            throw new BadRequestException("Phone number already in use: " + request.getPhoneNumber());
        }

        validateShiftAndBreak(request.getStartTime(), request.getEndTime(), request.getBreakTime(), request.getBreakEndTime());

        Role doctorRole = roleRepository.findByName(ERole.ROLE_DOCTOR)
            .orElseThrow(() -> new RuntimeException("ROLE_DOCTOR not found"));

        Department dept = departmentRepository.findById(request.getDepartmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(cleanPhone);
        user.setRoles(Set.of(doctorRole));
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDepartment(dept);
        doctor.setSpecialization(request.getSpecialization());
        doctor.setStartTime(request.getStartTime());
        doctor.setEndTime(request.getEndTime());
        doctor.setBreakTime(request.getBreakTime());
        doctor.setBreakEndTime(request.getBreakEndTime());

        log.info("Doctor created: {} in department {}", user.getEmail(), dept.getDepartmentName());
        return toResponse(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorResponse update(Long id, DoctorRequest request) {
        Doctor doctor = findOrThrow(id);
        Department dept = departmentRepository.findById(request.getDepartmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        validateShiftAndBreak(request.getStartTime(), request.getEndTime(), request.getBreakTime(), request.getBreakEndTime());

        User user = doctor.getUser();
        user.setName(request.getName());

        String rawPhone = request.getPhoneNumber();
        if (rawPhone != null && !rawPhone.isBlank()) {
            if (!ValidationUtils.isValidPhoneNumber(rawPhone)) {
                throw new BadRequestException("Invalid phone number format. Must contain 10 to 15 digits.");
            }
            String cleanPhone = rawPhone.replaceAll("\\s+", "");
            if (userRepository.existsByPhoneNumberAndIdNot(cleanPhone, user.getId())) {
                throw new BadRequestException("Phone number already in use by another account: " + rawPhone);
            }
            user.setPhoneNumber(cleanPhone);
        } else {
            user.setPhoneNumber(null);
        }
        userRepository.save(user);

        doctor.setDepartment(dept);
        doctor.setSpecialization(request.getSpecialization());
        doctor.setStartTime(request.getStartTime());
        doctor.setEndTime(request.getEndTime());
        doctor.setBreakTime(request.getBreakTime());
        doctor.setBreakEndTime(request.getBreakEndTime());

        return toResponse(doctorRepository.save(doctor));
    }

    private void validateShiftAndBreak(LocalTime startTime, LocalTime endTime, LocalTime breakTime, LocalTime breakEndTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Shift start time and end time are required");
        }
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Shift start time must be before end time");
        }

        if (breakTime != null || breakEndTime != null) {
            if (breakTime == null || breakEndTime == null) {
                throw new BadRequestException("Both break start time and break end time must be provided if break is set");
            }
            if (!breakTime.isBefore(breakEndTime)) {
                throw new BadRequestException("Break start time must be before break end time");
            }

            long breakMinutes = Duration.between(breakTime, breakEndTime).toMinutes();
            if (breakMinutes > 120) {
                throw new BadRequestException("Doctor break cannot exceed 2 hours (120 minutes)");
            }

            if (breakTime.isBefore(startTime) || breakEndTime.isAfter(endTime)) {
                throw new BadRequestException(
                    "Break time must be within doctor's shift hours (" + startTime + " – " + endTime + ")"
                );
            }

            long shiftMinutes = Duration.between(startTime, endTime).toMinutes();
            if (breakMinutes >= shiftMinutes) {
                throw new BadRequestException("Break duration cannot cover or exceed the entire shift duration");
            }
        }
    }

    @Transactional
    public void delete(Long id) {
        Doctor doctor = findOrThrow(id);
        User user = doctor.getUser();
        Long userId = user.getId();

        appointmentRepository.deleteByDoctorId(id);

        appointmentRepository.deleteByPatientId(userId);

        notificationRepository.deleteByUserId(userId);

        doctorRepository.delete(doctor);
        doctorRepository.flush();

        user.getRoles().clear();
        userRepository.delete(user);
        userRepository.flush();

        log.info("Doctor id {} and associated user id {} deleted successfully", id, userId);
    }

    private Doctor findOrThrow(Long id) {
        return doctorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + id));
    }

    public DoctorResponse toResponse(Doctor d) {
        DoctorResponse response = new DoctorResponse();
        response.setId(d.getId());
        response.setUserId(d.getUser().getId());
        response.setName(d.getUser().getName());
        response.setEmail(d.getUser().getEmail());
        response.setPhoneNumber(d.getUser().getPhoneNumber());
        response.setDepartmentId(d.getDepartment().getId());
        response.setDepartmentName(d.getDepartment().getDepartmentName());
        response.setSpecialization(d.getSpecialization());
        response.setStartTime(d.getStartTime());
        response.setEndTime(d.getEndTime());
        response.setBreakTime(d.getBreakTime());
        response.setBreakEndTime(d.getBreakEndTime());
        return response;
    }
}
