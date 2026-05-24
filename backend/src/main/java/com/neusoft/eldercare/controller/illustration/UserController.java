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
            @RequestParam(required = false) String keyword,//模糊搜索
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<SysUser> qw = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getIsDeleted, 0)//未删除
                .and(StringUtils.hasText(keyword), w -> w
                        .like(SysUser::getNickname, keyword)
                        .or()
                        .like(SysUser::getUsername, keyword));
        return Result.ok(userMapper.selectPage(new Page<>(page, size), qw));
    }//用户搜索

    @PostMapping
    public Result<SysUser> create(@RequestBody SysUser user) {
        user.setIsDeleted(0);//未删除
        if (!StringUtils.hasText(user.getPassword()) && StringUtils.hasText(user.getPhoneNumber())) {
            String phone = user.getPhoneNumber(); //自动生成默认密码
            user.setPassword(phone.length() >= 6 ? phone.substring(phone.length() - 6) : phone);
        }
        userMapper.insert(user);//存入数据库
        return Result.ok(user);
    }//创建用户

    @PutMapping("/{id}")
    public Result<SysUser> update(@PathVariable Integer id, @RequestBody SysUser user) {
        user.setId(id); //强制使用 URL 中的 ID，防止前端篡改
        userMapper.updateById(user);//非空字段更新数据库
        return Result.ok(userMapper.selectById(id));//更新后立刻再次查询数据库，让前端获取最新信息
    }//修改用户信息

    @PutMapping("/{id}/reset-password")
    public Result<Void> resetPassword(@PathVariable Integer id, @RequestBody SysUser body) {
        SysUser u = userMapper.selectById(id);
        if (u == null) {
            return Result.fail(404, "用户不存在");//验证用户是否存在
        }
        if (!StringUtils.hasText(body.getPassword()) || body.getPassword().length() < 4) {
            return Result.fail(400, "密码至少4位");//密码强度校验
        }
        SysUser patch = new SysUser();//局部更新，避免覆盖其他字段
        patch.setId(id);
        patch.setPassword(body.getPassword());
        userMapper.updateById(patch);
        return Result.ok(null);
    }//重置密码（未加密）

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        SysUser u = userMapper.selectById(id);
        if (u == null) {
            return Result.fail(404, "用户不存在");
        }
        boolean disabled = Boolean.TRUE.equals(body.get("disabled"));//分析状态，避免null抛出异常
        SysUser patch = new SysUser();
        patch.setId(id);
        patch.setIsDeleted(disabled ? 1 : 0);
        userMapper.updateById(patch); //局部更新
        return Result.ok(null);
    }//修改用户状态-启用/禁用
}
