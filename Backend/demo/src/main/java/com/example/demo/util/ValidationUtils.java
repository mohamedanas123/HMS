package com.example.demo.util;

public final class ValidationUtils {

    private ValidationUtils() {}


    public static boolean isValidPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            return false;
        }

        phone = phone.replaceAll("\\s+", "");


        return phone.matches("\\d{10,15}");
    }
}
