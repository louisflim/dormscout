package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Report;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReporter(User reporter);
    List<Report> findByStatus(String status);
}