package com.neusoft.eldercare.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 密码校验与 BCrypt 编解码（与云函数 bcryptjs 算法兼容）。
 */
@Component
public class PasswordPolicy {

    private static final int MIN_LEN = 4;
    private static final int MAX_LEN = 100;

    private final PasswordEncoder passwordEncoder;

    public PasswordPolicy(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public void validateRaw(String rawPassword) {
        if (!StringUtils.hasText(rawPassword)) {
            throw new IllegalArgumentException("密码不能为空");
        }
        if (rawPassword.length() < MIN_LEN) {
            throw new IllegalArgumentException("密码至少4位");
        }
        if (rawPassword.length() > MAX_LEN) {
            throw new IllegalArgumentException("密码长度不能超过100位");
        }
    }

    public String encode(String rawPassword) {
        validateRaw(rawPassword);
        return passwordEncoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String encodedPassword) {
        if (!StringUtils.hasText(rawPassword) || !StringUtils.hasText(encodedPassword)) {
            return false;
        }
        if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$") || encodedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, encodedPassword);
        }
        return encodedPassword.equals(rawPassword);
    }
}
