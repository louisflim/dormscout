package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Message;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationId(String conversationId);
    List<Message> findBySenderOrReceiver(User sender, User receiver);
    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);
}