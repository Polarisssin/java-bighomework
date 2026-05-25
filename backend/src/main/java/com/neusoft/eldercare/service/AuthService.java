package com.neusoft.eldercare.service;

import com.neusoft.eldercare.dto.LoginRequest;
import com.neusoft.eldercare.dto.UserVo;
import com.neusoft.eldercare.entity.Menu;
import com.neusoft.eldercare.entity.SysUser;
import com.neusoft.eldercare.mapper.MenuMapper;
import com.neusoft.eldercare.mapper.SysUserMapper;
import com.neusoft.eldercare.security.JwtUtil;
import com.neusoft.eldercare.security.PasswordPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final MenuMapper menuMapper;
    private final JwtUtil jwtUtil;
    private final PasswordPolicy passwordPolicy;

    public Map<String, Object> login(LoginRequest req) {
        String username = req.getUsername() == null ? "" : req.getUsername().trim();
        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("请输入账号");
        }
        SysUser user = userMapper.findByUsername(username);
        if (user == null || user.getIsDeleted() != null && user.getIsDeleted() != 0) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        if (!passwordPolicy.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        if (!user.getPassword().startsWith("$2")) {
            SysUser patch = new SysUser();
            patch.setId(user.getId());
            patch.setPassword(passwordPolicy.encode(req.getPassword()));
            userMapper.updateById(patch);
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRoleId());
        List<Menu> menus = menuMapper.listByRoleId(user.getRoleId());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", UserVo.from(user));
        data.put("menus", menus);
        return data;
    }
}
