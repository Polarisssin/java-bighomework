package com.neusoft.eldercare.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neusoft.eldercare.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) {
        writeJson(objectMapper, response, HttpServletResponse.SC_UNAUTHORIZED, Result.fail(401, "未登录或登录已过期"));
    }

    static void writeJson(ObjectMapper mapper, HttpServletResponse response, int status, Result<?> body) {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        try {
            mapper.writeValue(response.getWriter(), body);
        } catch (Exception ignored) {
            // fallback
        }
    }
}
