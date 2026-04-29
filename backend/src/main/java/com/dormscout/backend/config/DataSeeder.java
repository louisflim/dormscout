package com.dormscout.backend.config;

import com.dormscout.backend.entity.User;
import com.dormscout.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@dormscout.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@dormscout.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("DormScout");
            admin.setUserType("admin");
            userRepository.save(admin);
            System.out.println("✅ Admin user created successfully!");
        } else {
            System.out.println("✅ Admin user already exists.");
        }
    }
}
