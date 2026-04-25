package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Message;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.service.MessageService;
import com.dormscout.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Message message,
                                         @RequestParam Long senderId,
                                         @RequestParam Long receiverId) {
        try {
            Optional<User> senderOpt   = userService.findById(senderId);
            Optional<User> receiverOpt = userService.findById(receiverId);

            if (!senderOpt.isPresent() || !receiverOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false, "message", "Sender or receiver not found"
                ));
            }

            message.setSender(senderOpt.get());
            message.setReceiver(receiverOpt.get());

            Message sent = messageService.sendMessage(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true, "message", "Message sent", "data", sent
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false, "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages() {
        return ResponseEntity.ok(messageService.getAllMessages());
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<Message>> getByConversation(@PathVariable String conversationId) {
        return ResponseEntity.ok(messageService.getMessagesByConversation(conversationId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        try {
            messageService.deleteMessage(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Message deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false, "message", "Message not found"
            ));
        }
    }
}