package com.example.demo.repository;

import com.example.demo.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    @Query("SELECT d FROM Doctor d JOIN FETCH d.user JOIN FETCH d.department WHERE d.user.id = :userId")
    Optional<Doctor> findByUserId(@Param("userId") Long userId);

    @Query("SELECT d FROM Doctor d JOIN FETCH d.user JOIN FETCH d.department WHERE d.department.id = :departmentId")
    List<Doctor> findByDepartmentId(@Param("departmentId") Integer departmentId);

    boolean existsByUserId(Long userId);

    @Query("SELECT d FROM Doctor d JOIN FETCH d.user JOIN FETCH d.department")
    List<Doctor> findAllWithDetails();

    @Query("SELECT d FROM Doctor d JOIN FETCH d.user JOIN FETCH d.department WHERE d.id = :id")
    Optional<Doctor> findById(@Param("id") Long id);
}
