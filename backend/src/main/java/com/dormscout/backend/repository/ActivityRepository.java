package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Activity> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, Boolean isRead);
}