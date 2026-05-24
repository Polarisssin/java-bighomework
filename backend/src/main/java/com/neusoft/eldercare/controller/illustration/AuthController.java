package com.neusoft.eldercare.controller;

import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.dto.LoginRequest;
import com.neusoft.eldercare.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "认证")
@RestController
@RequestMapping("/api/auth") //定义接口统一路径
@RequiredArgsConstructor //自动为类中所有 final 字段生成构造函数，依赖注入
public class AuthController {

    private final AuthService authService; //依赖注入

    @Operation(summary = "登录")
    @PostMapping("/login") //POST /api/auth/login 涉及敏感数据，使用 POST 请求，并使用 @Valid 注解进行参数校验
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return Result.ok(authService.login(request)); //低耦合-Service层调用
    }//@Valid 自动校验 
    //@RequestBody: 指示 Spring 将 HTTP 请求体中的 JSON 数据反序列化为 LoginRequest 对象
    //LoginRequest：DTO传输与封装
}

/**
 * 登录接口
 * @param request 登录请求参数
 * @return 登录结果
 */