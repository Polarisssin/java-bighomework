package com.neusoft.eldercare.service;

import com.neusoft.eldercare.dto.LoginRequest;
import com.neusoft.eldercare.entity.Menu;
import com.neusoft.eldercare.entity.SysUser;
import com.neusoft.eldercare.mapper.MenuMapper;
import com.neusoft.eldercare.mapper.SysUserMapper;
import com.neusoft.eldercare.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final MenuMapper menuMapper;
    private final JwtUtil jwtUtil;

    public Map<String, Object> login(LoginRequest req) {
        SysUser user = userMapper.findByUsername(req.getUsername());
        if (user == null || !user.getPassword().equals(req.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRoleId());
        List<Menu> menus = menuMapper.listByRoleId(user.getRoleId());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);
        data.put("menus", menus);
        return data;
    }
}
