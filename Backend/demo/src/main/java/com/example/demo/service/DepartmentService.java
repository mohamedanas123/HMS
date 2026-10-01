package com.example.demo.service;

import com.example.demo.dto.request.DepartmentRequest;
import com.example.demo.dto.response.DepartmentResponse;
import com.example.demo.entity.Department;
import com.example.demo.exception.ConflictException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public DepartmentResponse getById(Integer id) {
        return toResponse(findOrThrow(id));
    }

    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByDepartmentName(request.getDepartmentName())) {
            throw new ConflictException("Department '" + request.getDepartmentName() + "' already exists");
        }
        Department dept = new Department();
        dept.setDepartmentName(request.getDepartmentName());
        dept.setDepartmentDescription(request.getDepartmentDescription());
        return toResponse(departmentRepository.save(dept));
    }

    public DepartmentResponse update(Integer id, DepartmentRequest request) {
        Department dept = findOrThrow(id);
        dept.setDepartmentName(request.getDepartmentName());
        dept.setDepartmentDescription(request.getDepartmentDescription());
        return toResponse(departmentRepository.save(dept));
    }

    public void delete(Integer id) {
        findOrThrow(id);
        departmentRepository.deleteById(id);
    }

    private Department findOrThrow(Integer id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
    }

    private DepartmentResponse toResponse(Department d) {
        DepartmentResponse response = new DepartmentResponse();
        response.setId(d.getId());
        response.setDepartmentName(d.getDepartmentName());
        response.setDepartmentDescription(d.getDepartmentDescription());
        return response;
    }
}
