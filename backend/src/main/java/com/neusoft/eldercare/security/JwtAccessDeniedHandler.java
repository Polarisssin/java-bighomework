package com.neusoft.eldercare.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neusoft.eldercare.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "无权限访问";
        JwtAuthenticationEntryPoint.writeJson(objectMapper, response, HttpServletResponse.SC_FORBIDDEN, Result.fail(403, message));
    }
}
