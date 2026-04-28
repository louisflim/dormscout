package com.dormscout.backend.service;

import com.dormscout.backend.entity.Activity;
import com.dormscout.backend.repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ActivityService {
    @Autowired
    private ActivityRepository activityRepository;

    public Activity createActivity(Long userId, String type, String text, String time, String nav) {
        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setType(type);
        activity.setText(text);
        activity.setTime(time);
        activity.setNav(nav);
        activity.setIsRead(false);
        return activityRepository.save(activity);
    }

    public List<Activity> getActivitiesByUser(Long userId) {
        return activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long activityId) {
        activityRepository.findById(activityId).ifPresent(activity -> {
            activity.setIsRead(true);
            activityRepository.save(activity);
        });
    }

    public void deleteActivity(Long activityId) {
        activityRepository.deleteById(activityId);
    }

    public int getUnreadCount(Long userId) {
        return activityRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false).size();
    }
}