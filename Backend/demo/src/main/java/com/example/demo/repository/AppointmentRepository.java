package com.example.demo.repository;

import com.example.demo.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a " +
            "JOIN FETCH a.doctor d JOIN FETCH d.user " +
            "JOIN FETCH d.department JOIN FETCH a.patient " +
            "WHERE a.patient.id = :patientId ORDER BY a.appointmentDate DESC, a.startTime DESC")
    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(@Param("patientId") Long patientId);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.doctor d JOIN FETCH d.user JOIN FETCH d.department JOIN FETCH a.patient WHERE d.id = :doctorId ORDER BY a.appointmentDate DESC, a.startTime DESC")
    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(@Param("doctorId") Long doctorId);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.doctor d JOIN FETCH d.user JOIN FETCH d.department JOIN FETCH a.patient WHERE d.id = :doctorId AND a.appointmentDate = :date ORDER BY a.startTime")
    List<Appointment> findByDoctorIdAndAppointmentDateOrderByStartTime(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.doctor d JOIN FETCH d.user JOIN FETCH d.department JOIN FETCH a.patient ORDER BY a.appointmentDate DESC, a.startTime DESC")
    List<Appointment> findAllWithDetails();

    @Query("SELECT a FROM Appointment a JOIN FETCH a.doctor d JOIN FETCH d.user JOIN FETCH d.department JOIN FETCH a.patient WHERE a.id = :id")
    java.util.Optional<Appointment> findById(@Param("id") Long id);

    @Query("""
        SELECT a FROM Appointment a
        WHERE a.doctor.id = :doctorId
          AND a.appointmentDate = :date
          AND a.status <> 'CANCELLED'
          AND a.startTime < :endTime
          AND a.endTime > :startTime
    """)
    List<Appointment> findConflicting(
        @Param("doctorId") Long doctorId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    @Query("""
        SELECT a FROM Appointment a
        WHERE a.doctor.id = :doctorId
          AND a.appointmentDate = :date
          AND a.status <> 'CANCELLED'
        ORDER BY a.startTime
    """)
    List<Appointment> findBookedSlots(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Appointment a WHERE a.doctor.id = :doctorId")
    void deleteByDoctorId(@Param("doctorId") Long doctorId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Appointment a WHERE a.patient.id = :patientId")
    void deleteByPatientId(@Param("patientId") Long patientId);
}
