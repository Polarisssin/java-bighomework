package com.neusoft.eldercare.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.entity.SysUser;
import com.neusoft.eldercare.mapper.SysUserMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "用户管理")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SysUserMapper userMapper;

    @GetMapping
    public Result<Page<SysUser>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<SysUser> qw = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getIsDeleted, 0)
                .and(StringUtils.hasText(keyword), w -> w
                        .like(SysUser::getNickname, keyword)
                        .or()
                        .like(SysUser::getUsername, keyword));
        return Result.ok(userMapper.selectPage(new Page<>(page, size), qw));
    }

    @PostMapping
    public Result<SysUser> create(@RequestBody SysUser user) {
        user.setIsDeleted(0);
        if (!StringUtils.hasText(user.getPassword()) && StringUtils.hasText(user.getPhoneNumber())) {
            String phone = user.getPhoneNumber();
            user.setPassword(phone.length() >= 6 ? phone.substring(phone.length() - 6) : phone);
        }
        userMapper.insert(user);
        return Result.ok(user);
    }

    @PutMapping("/{id}")
    public Result<SysUser> update(@PathVariable Integer id, @RequestBody SysUser user) {
        user.setId(id);
        userMapper.updateById(user);
        return Result.ok(userMapper.selectById(id));
    }

    @PutMapping("/{id}/reset-password")
    public Result<Void> resetPassword(@PathVariable Integer id, @RequestBody SysUser body) {
        SysUser u = userMapper.selectById(id);
        if (u == null) {
            return Result.fail(404, "用户不存在");
        }
        if (!StringUtils.hasText(body.getPassword()) || body.getPassword().length() < 4) {
            return Result.fail(400, "密码至少4位");
        }
        SysUser patch = new SysUser();
        patch.setId(id);
        patch.setPassword(body.getPassword());
        userMapper.updateById(patch);
        return Result.ok(null);
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        SysUser u = userMapper.selectById(id);
        if (u == null) {
            return Result.fail(404, "用户不存在");
        }
        boolean disabled = Boolean.TRUE.equals(body.get("disabled"));
        SysUser patch = new SysUser();
        patch.setId(id);
        patch.setIsDeleted(disabled ? 1 : 0);
        userMapper.updateById(patch);
        return Result.ok(null);
    }
}
