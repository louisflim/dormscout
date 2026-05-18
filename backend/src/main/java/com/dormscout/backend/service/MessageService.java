package com.dormscout.backend.service;

import com.dormscout.backend.entity.Message;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    public Message sendMessage(Message message) {
        if (message.getConversationId() == null || message.getConversationId().isBlank()) {
            User sender = message.getSender();
            User receiver = message.getReceiver();
            if (sender != null && receiver != null && sender.getId() != null && receiver.getId() != null) {
                long min = Math.min(sender.getId(), receiver.getId());
                long max = Math.max(sender.getId(), receiver.getId());
                message.setConversationId("conv_" + min + "_" + max);
            }
        }
        return messageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public List<Message> getAllMessages() {
        return messageRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Message> getMessagesByConversation(String conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional(readOnly = true)
    public List<Message> getMessagesByUser(User user) {
        return messageRepository.findBySenderOrReceiver(user, user);
    }

    @Transactional(readOnly = true)
    public Optional<Message> getMessageById(Long id) {
        return messageRepository.findById(id);
    }

    /** Messages exchanged between two specific users (chronological) */
    @Transactional(readOnly = true)
    public List<Message> getMessagesBetweenUsers(Long uid1, Long uid2) {
        return messageRepository.findConversationMessages(uid1, uid2);
    }

    /**
     * Returns a list of conversation summaries for the given user.
     * Each summary contains: conversationId, partnerId, partnerName, partnerInitials,
     * lastMessage, lastMessageTime (epoch ms), unreadCount.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversationsForUser(Long userId) {
        List<Message> allMessages = messageRepository.findAllByUserId(userId);

        // Group messages by conversationId, keeping only the latest per conversation
        Map<String, Message> latestByConv = new LinkedHashMap<>();
        for (Message msg : allMessages) {
            String convId = msg.getConversationId();
            if (convId == null || convId.isBlank()) continue;
            Message existing = latestByConv.get(convId);
            if (existing == null || msg.getCreatedAt().isAfter(existing.getCreatedAt())) {
                latestByConv.put(convId, msg);
            }
        }

        // Count unread per conversation (messages received by this user that are unread)
        Map<String, Long> unreadByConv = allMessages.stream()
            .filter(m -> m.getConversationId() != null
                      && !m.isRead()
                      && m.getReceiver() != null
                      && userId.equals(m.getReceiver().getId()))
            .collect(Collectors.groupingBy(Message::getConversationId, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map.Entry<String, Message> entry : latestByConv.entrySet()) {
            String convId = entry.getKey();
            Message latest = entry.getValue();

            // Determine partner (the user who is NOT the current user)
            User partner = null;
            if (latest.getSender() != null && userId.equals(latest.getSender().getId())) {
                partner = latest.getReceiver();
            } else {
                partner = latest.getSender();
            }
            if (partner == null) continue;

            String first = partner.getFirstName() != null ? partner.getFirstName().trim() : "";
            String last  = partner.getLastName()  != null ? partner.getLastName().trim()  : "";
            String partnerName = (first + " " + last).trim();
            if (partnerName.isEmpty()) partnerName = partner.getEmail();

            // Build initials (up to 2 characters)
            String initials = Arrays.stream(partnerName.split("\\s+"))
                .filter(p -> !p.isEmpty())
                .map(p -> String.valueOf(p.charAt(0)).toUpperCase())
                .collect(Collectors.joining());
            if (initials.length() > 2) initials = initials.substring(0, 2);

            long lastMsgTime = latest.getCreatedAt() != null
                ? latest.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                : System.currentTimeMillis();

            Map<String, Object> conv = new LinkedHashMap<>();
            conv.put("conversationId",   convId);
            conv.put("partnerId",        partner.getId());
            conv.put("partnerName",      partnerName);
            conv.put("partnerInitials",  initials);
            conv.put("partnerProfileImage", partner.getProfileImage());
            conv.put("lastMessage",      latest.getContent());
            conv.put("lastMessageTime",  lastMsgTime);
            conv.put("unreadCount",      unreadByConv.getOrDefault(convId, 0L).intValue());
            result.add(conv);
        }

        // Sort conversations by most recent first
        result.sort((a, b) -> Long.compare(
            (Long) b.get("lastMessageTime"),
            (Long) a.get("lastMessageTime")
        ));

        return result;
    }

    /** Mark all unread messages in a conversation as read for the given reader */
    public void markConversationRead(String conversationId, Long readerId) {
        List<Message> unread = messageRepository.findUnreadByConversationAndReceiver(conversationId, readerId);
        unread.forEach(m -> m.setRead(true));
        messageRepository.saveAll(unread);
    }

    /** Delete all messages in a conversation that belong to (sent or received by) the user */
    public void deleteConversationForUser(String conversationId, Long userId) {
        messageRepository.deleteByConversationIdAndUserId(conversationId, userId);
    }

    public void deleteMessage(Long id) {
        messageRepository.deleteById(id);
    }
}
