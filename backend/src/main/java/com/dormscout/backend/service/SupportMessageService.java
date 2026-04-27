package com.dormscout.backend.service;

import com.dormscout.backend.entity.SupportMessage;
import com.dormscout.backend.repository.SupportMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SupportMessageService {
    @Autowired
    private SupportMessageRepository supportMessageRepository;

    public SupportMessage create(SupportMessage supportMessage) {
        return supportMessageRepository.save(supportMessage);
    }

    public List<SupportMessage> getAll() {
        return supportMessageRepository.findAll();
    }

    public List<SupportMessage> getByStatus(String status) {
        return supportMessageRepository.findByStatus(status);
    }

    public Optional<SupportMessage> getById(Long id) {
        return supportMessageRepository.findById(id);
    }

    public SupportMessage updateStatus(Long id, String status) {
        SupportMessage supportMessage = supportMessageRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Support message not found"));
        supportMessage.setStatus(status);
        return supportMessageRepository.save(supportMessage);
    }

    public void delete(Long id) {
        supportMessageRepository.deleteById(id);
    }
}
