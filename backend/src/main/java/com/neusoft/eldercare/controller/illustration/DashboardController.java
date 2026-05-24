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

    private final JdbcTemplate jdbcTemplate; // jdbc模板注入，没有使用Service

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() { //获取统计数据
        LoginUser user = (LoginUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); //获取当前用户
        int roleId = user.getUser().getRoleId();
        int uid = user.getUser().getId();//提取id和角色->展示不同分工下的用户界面

        Integer resident = jdbcTemplate.queryForObject( //在住人数
                "SELECT COUNT(*) FROM customer WHERE is_deleted=0 AND resident_status=1", Integer.class);
        Integer freeBed = jdbcTemplate.queryForObject( //空床
                "SELECT COUNT(*) FROM bed WHERE bed_status=1", Integer.class);
        Integer pendingOut = jdbcTemplate.queryForObject( //外出待审批
                "SELECT COUNT(*) FROM outward WHERE is_deleted=0 AND auditstatus=0", Integer.class);
        Integer pendingBack = jdbcTemplate.queryForObject( //归院待审批
                "SELECT COUNT(*) FROM backdown WHERE is_deleted=0 AND auditstatus=0", Integer.class);

        String todaySql = "SELECT COUNT(*) FROM nurserecord WHERE is_deleted=0 AND DATE(nursing_time)=CURDATE()";
        Object[] todayArgs = new Object[]{};
        if (roleId == 2) { //只统计当前用户自己创建的护理记录
            todaySql += " AND user_id=?";
            todayArgs = new Object[]{uid};
        }
        Integer todayRecord = jdbcTemplate.queryForObject(todaySql, Integer.class, todayArgs);

        Map<String, Object> data = new HashMap<>(); //组装返回数据
        data.put("residentCount", resident);
        data.put("freeBedCount", freeBed);
        data.put("pendingOutward", pendingOut);
        data.put("pendingBackdown", pendingBack);
        data.put("todayRecordCount", todayRecord);
        data.put("roleId", roleId); //管理员都能看
        if (roleId == 2) { //管家只能看自己名单下的老人
            Integer mine = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM customer WHERE is_deleted=0 AND resident_status=1 AND user_id=?",
                    Integer.class, uid);
            data.put("myCustomerCount", mine);
        }
        return Result.ok(data);
    }
}
/**
 * 后台客户管理
 */