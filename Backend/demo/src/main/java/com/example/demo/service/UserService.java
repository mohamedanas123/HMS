package com.example.demo.service;

import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.UserUpdateRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.ERole;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DoctorRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(ERole role) {
        return userRepository.findByRole(role).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public UserResponse getCurrentUser(Long currentUserId) {
        return getUserById(currentUserId);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = findOrThrow(id);
        user.setName(request.getName());

        String rawPhone = request.getPhoneNumber();
        if (rawPhone != null && !rawPhone.isBlank()) {
            if (!com.example.demo.util.ValidationUtils.isValidPhoneNumber(rawPhone)) {
                throw new BadRequestException("Invalid phone number format. Must contain 10 to 15 digits.");
            }
            String cleanPhone = rawPhone.replaceAll("\\s+", "");
            if (userRepository.existsByPhoneNumberAndIdNot(cleanPhone, id)) {
                throw new BadRequestException("Phone number already in use by another account: " + rawPhone);
            }
            user.setPhoneNumber(cleanPhone);
        } else {
            user.setPhoneNumber(null);
        }

        User updatedUser = userRepository.save(user);
        log.info("User id {} updated successfully", id);
        return toResponse(updatedUser);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findOrThrow(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6 || !request.getNewPassword().matches("^(?=.*[a-zA-Z])(?=.*\\d).+$")) {
            throw new BadRequestException("New password must be at least 6 characters long and contain both letters and numbers");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as the old password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user id {}", userId);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findOrThrow(id);

        doctorRepository.findByUserId(id).ifPresent(doctor -> {
            appointmentRepository.deleteByDoctorId(doctor.getId());
            doctorRepository.delete(doctor);
            doctorRepository.flush();
        });

        appointmentRepository.deleteByPatientId(id);

        notificationRepository.deleteByUserId(id);

        user.getRoles().clear();
        userRepository.delete(user);
        userRepository.flush();

        log.info("User id {} deleted successfully", id);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public UserResponse toResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                roles
        );
    }
}
