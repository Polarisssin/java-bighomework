package com.neusoft.eldercare.controller;

import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        LoginUser user = (LoginUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        int roleId = user.getUser().getRoleId();
        int uid = user.getUser().getId();

        Integer resident = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM customer WHERE is_deleted=0 AND resident_status=1", Integer.class);
        Integer freeBed = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM bed WHERE bed_status=1", Integer.class);
        Integer pendingOut = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM outward WHERE is_deleted=0 AND auditstatus=0", Integer.class);
        Integer pendingBack = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM backdown WHERE is_deleted=0 AND auditstatus=0", Integer.class);

        String todaySql = "SELECT COUNT(*) FROM nurserecord WHERE is_deleted=0 AND DATE(nursing_time)=CURDATE()";
        Object[] todayArgs = new Object[]{};
        if (roleId == 2) {
            todaySql += " AND user_id=?";
            todayArgs = new Object[]{uid};
        }
        Integer todayRecord = jdbcTemplate.queryForObject(todaySql, Integer.class, todayArgs);

        Map<String, Object> data = new HashMap<>();
        data.put("residentCount", resident);
        data.put("freeBedCount", freeBed);
        data.put("pendingOutward", pendingOut);
        data.put("pendingBackdown", pendingBack);
        data.put("todayRecordCount", todayRecord);
        data.put("roleId", roleId);
        if (roleId == 2) {
            Integer mine = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM customer WHERE is_deleted=0 AND resident_status=1 AND user_id=?",
                    Integer.class, uid);
            data.put("myCustomerCount", mine);
        }
        return Result.ok(data);
    }
}
