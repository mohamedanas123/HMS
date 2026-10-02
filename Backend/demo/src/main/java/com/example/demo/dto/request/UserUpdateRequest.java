package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {

    @NotBlank(message = "Name cannot be empty")
    private String name;

    @jakarta.validation.constraints.Pattern(regexp = "^$|^\\+?[0-9\\s\\-\\(\\)]{10,20}$", message = "Please enter a valid phone number (10 to 15 digits)")
    private String phoneNumber;
}
