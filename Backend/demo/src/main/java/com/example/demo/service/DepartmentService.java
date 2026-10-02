package com.example.demo.service;

import com.example.demo.dto.request.DepartmentRequest;
import com.example.demo.dto.response.DepartmentResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Doctor;
import com.example.demo.exception.ConflictException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.DoctorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentService.class);

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorService doctorService;

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

    @Transactional
    public void delete(Integer id) {
        Department dept = findOrThrow(id);
        List<Doctor> doctors = doctorRepository.findByDepartmentId(id);
        for (Doctor doctor : doctors) {
            doctorService.delete(doctor.getId());
        }
        departmentRepository.delete(dept);
        departmentRepository.flush();
        log.info("Department id {} and {} associated doctor(s) deleted successfully", id, doctors.size());
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
