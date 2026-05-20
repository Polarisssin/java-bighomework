package com.neusoft.eldercare.security;

import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.mapper.CustomerMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static LoginUser requireLogin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof LoginUser loginUser)) {
            throw new ForbiddenException("未登录");
        }
        return loginUser;
    }

    public static boolean isAdmin(LoginUser user) {
        return user.getUser().getRoleId() != null && user.getUser().getRoleId() == 1;
    }

    public static boolean isCaregiver(LoginUser user) {
        return user.getUser().getRoleId() != null && user.getUser().getRoleId() == 2;
    }

    public static void requireAdmin() {
        if (!isAdmin(requireLogin())) {
            throw new ForbiddenException("仅管理员可操作");
        }
    }

    public static void assertCaregiverOwnsCustomer(CustomerMapper customerMapper, Integer customerId) {
        LoginUser user = requireLogin();
        if (!isCaregiver(user)) {
            return;
        }
        Customer customer = customerMapper.selectById(customerId);
        if (customer == null || customer.getIsDeleted() == 1) {
            throw new IllegalArgumentException("客户不存在");
        }
        Integer ownerId = customer.getUserId();
        if (ownerId == null || !ownerId.equals(user.getUser().getId())) {
            throw new ForbiddenException("只能操作您负责的老人");
        }
    }
}
