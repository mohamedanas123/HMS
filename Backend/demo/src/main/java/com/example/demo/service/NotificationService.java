package com.example.demo.service;

import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    /** Called internally to create notifications. */
    @Transactional
    public void send(User user, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setIsRead(false);
        notificationRepository.save(n);
    }

    public List<NotificationResponse> getMyNotifications() {
        Long userId = getCurrentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public long getUnreadCount() {
        return notificationRepository.countByUserIdAndIsReadFalse(getCurrentUserId());
    }

    @Transactional
    public NotificationResponse markRead(Long id) {
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        n.setIsRead(true);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllRead() {
        Long userId = getCurrentUserId();
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(n -> n.setIsRead(true));
    }

    private Long getCurrentUserId() {
        UserDetailsImpl principal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal.getId();
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse response = new NotificationResponse();
        response.setId(n.getId());
        response.setTitle(n.getTitle());
        response.setMessage(n.getMessage());
        response.setIsRead(n.getIsRead());
        response.setCreatedAt(n.getCreatedAt());
        return response;
    }
}
