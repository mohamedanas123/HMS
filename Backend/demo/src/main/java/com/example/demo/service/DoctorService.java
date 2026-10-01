package com.example.demo.service;

import com.example.demo.dto.request.DoctorProfileUpdateRequest;
import com.example.demo.dto.request.DoctorRequest;
import com.example.demo.dto.response.DoctorResponse;
import com.example.demo.entity.*;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        // Update user fields
        User user = doctor.getUser();
        user.setName(request.getName());
        user.setPhoneNumber(request.getPhoneNumber());
        userRepository.save(user);

        // Update doctor fields
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
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        Role doctorRole = roleRepository.findByName(ERole.ROLE_DOCTOR)
            .orElseThrow(() -> new RuntimeException("ROLE_DOCTOR not found"));

        Department dept = departmentRepository.findById(request.getDepartmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
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

        // Update user info
        User user = doctor.getUser();
        user.setName(request.getName());
        user.setPhoneNumber(request.getPhoneNumber());
        userRepository.save(user);

        // Update doctor info
        doctor.setDepartment(dept);
        doctor.setSpecialization(request.getSpecialization());
        doctor.setStartTime(request.getStartTime());
        doctor.setEndTime(request.getEndTime());
        doctor.setBreakTime(request.getBreakTime());
        doctor.setBreakEndTime(request.getBreakEndTime());

        return toResponse(doctorRepository.save(doctor));
    }

    @Transactional
    public void delete(Long id) {
        findOrThrow(id);
        Doctor doctor = doctorRepository.findById(id).orElseThrow();
        Long userId = doctor.getUser().getId();
        doctorRepository.deleteById(id);
        userRepository.deleteById(userId);
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
