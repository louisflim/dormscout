package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Message;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationId(String conversationId);

    List<Message> findBySenderOrReceiver(User sender, User receiver);

    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    /** All messages where the user is either sender or receiver, newest first */
    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.createdAt DESC")
    List<Message> findAllByUserId(@Param("userId") Long userId);

    /** Full conversation thread between two users, chronological */
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :uid1 AND m.receiver.id = :uid2) OR (m.sender.id = :uid2 AND m.receiver.id = :uid1) ORDER BY m.createdAt ASC")
    List<Message> findConversationMessages(@Param("uid1") Long uid1, @Param("uid2") Long uid2);

    /** Unread messages in a conversation destined for a specific user */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :convId AND m.receiver.id = :readerId AND m.isRead = false")
    List<Message> findUnreadByConversationAndReceiver(@Param("convId") String convId, @Param("readerId") Long readerId);

    /** Delete all messages in a conversation */
    @Modifying
    @Query("DELETE FROM Message m WHERE m.conversationId = :convId AND (m.sender.id = :userId OR m.receiver.id = :userId)")
    void deleteByConversationIdAndUserId(@Param("convId") String convId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
