package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class DepartmentResponse {
    private Integer id;
    private String departmentName;
    private String departmentDescription;
}
