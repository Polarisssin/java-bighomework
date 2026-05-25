package com.neusoft.eldercare.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.dto.ResetPasswordRequest;
import com.neusoft.eldercare.dto.UserVo;
import com.neusoft.eldercare.entity.SysUser;
import com.neusoft.eldercare.mapper.SysUserMapper;
import com.neusoft.eldercare.security.ForbiddenException;
import com.neusoft.eldercare.security.LoginUser;
import com.neusoft.eldercare.security.PasswordPolicy;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "用户管理")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SysUserMapper userMapper;
    private final PasswordPolicy passwordPolicy;

    @GetMapping
    public Result<Page<UserVo>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<SysUser> qw = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getIsDeleted, 0)
                .and(StringUtils.hasText(keyword), w -> w
                        .like(SysUser::getNickname, keyword)
                        .or()
                        .like(SysUser::getUsername, keyword));
        Page<SysUser> raw = userMapper.selectPage(new Page<>(page, size), qw);
        Page<UserVo> voPage = new Page<>(raw.getCurrent(), raw.getSize(), raw.getTotal());
        voPage.setRecords(raw.getRecords().stream().map(UserVo::from).toList());
        return Result.ok(voPage);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<UserVo> create(@RequestBody SysUser user) {
        user.setIsDeleted(0);
        if (!StringUtils.hasText(user.getUsername())) {
            return Result.fail(400, "请输入账号");
        }
        if (!StringUtils.hasText(user.getPassword()) && StringUtils.hasText(user.getPhoneNumber())) {
            String phone = user.getPhoneNumber();
            user.setPassword(phone.length() >= 6 ? phone.substring(phone.length() - 6) : phone);
        }
        if (!StringUtils.hasText(user.getPassword())) {
            return Result.fail(400, "请设置密码");
        }
        user.setPassword(passwordPolicy.encode(user.getPassword()));
        userMapper.insert(user);
        return Result.ok(UserVo.from(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<UserVo> update(@PathVariable Integer id, @RequestBody SysUser user) {
        user.setId(id);
        user.setPassword(null);
        userMapper.updateById(user);
        return Result.ok(UserVo.from(userMapper.selectById(id)));
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> resetPassword(@PathVariable Integer id, @Valid @RequestBody ResetPasswordRequest body) {
        SysUser u = userMapper.selectById(id);
        if (u == null) {
            return Result.fail(404, "用户不存在");
        }
        SysUser patch = new SysUser();
        patch.setId(id);
        patch.setPassword(passwordPolicy.encode(body.getPassword()));
        userMapper.updateById(patch);
        return Result.ok(null);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal LoginUser loginUser) {
        SysUser u = userMapper.selectById(id);
        if (u == null) {
            return Result.fail(404, "用户不存在");
        }
        boolean disabled = Boolean.TRUE.equals(body.get("disabled"));
        if (disabled && loginUser.getUser().getId().equals(id)) {
            throw new ForbiddenException("不能禁用当前登录账号");
        }
        SysUser patch = new SysUser();
        patch.setId(id);
        patch.setIsDeleted(disabled ? 1 : 0);
        userMapper.updateById(patch);
        return Result.ok(null);
    }
}
