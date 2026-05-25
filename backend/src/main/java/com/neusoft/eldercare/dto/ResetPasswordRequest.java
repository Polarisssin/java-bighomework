package com.neusoft.eldercare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "请输入新密码")
    @Size(min = 4, max = 100, message = "密码长度为4-100位")
    private String password;
}
