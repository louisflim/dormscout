package com.dormscout.backend.config;

import com.dormscout.backend.service.AdminTokenService;
import com.dormscout.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.Optional;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Autowired
    private AdminTokenService adminTokenService;

    @Autowired
    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (!requiresAdminAuth(path, request.getMethod())) {
            return true;
        }

        String token = extractBearerToken(request);
        Optional<Long> adminId = adminTokenService.validateToken(token);
        if (adminId.isEmpty()) {
            writeUnauthorized(response, "Admin authentication required");
            return false;
        }

        boolean isAdmin = userService.findById(adminId.get())
                .map(u -> "admin".equalsIgnoreCase(u.getUserType()))
                .orElse(false);
        if (!isAdmin) {
            writeUnauthorized(response, "Admin access denied");
            return false;
        }

        request.setAttribute("adminUserId", adminId.get());
        return true;
    }

    private boolean requiresAdminAuth(String path, String method) {
        if (!path.startsWith("/api/users/admin")) {
            return false;
        }
        return !("/api/users/admin/login".equals(path) && "POST".equalsIgnoreCase(method));
    }

    private String extractBearerToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7).trim();
        }
        String header = request.getHeader("X-Admin-Token");
        return header != null ? header.trim() : null;
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), Map.of(
                "success", false,
                "message", message
        ));
    }
}
