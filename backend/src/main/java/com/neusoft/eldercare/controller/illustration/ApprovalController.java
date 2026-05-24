package com.neusoft.eldercare.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.entity.Backdown;
import com.neusoft.eldercare.entity.Outward;
import com.neusoft.eldercare.security.LoginUser;
import com.neusoft.eldercare.service.ApprovalService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "审批") //使用 Swagger 注解自动生成接口文档，方便前后端联调。
@RestController //@Controller + @ResponseBody  控制器+返回JSON数据  //前后端分离项目，比@Controller更方便
@RequestMapping("/api/approval") //定义统一接口前缀
@RequiredArgsConstructor //自动生成构造方法
public class ApprovalController { //依赖注入 Controller → Service → Mapper (MVC)

    private final ApprovalService approvalService;

    @GetMapping("/outward") //GET /api/approval/outward
    public Result<Page<Outward>> outwardPage( //统一接口
            @RequestParam(required = false) String customerName, //模糊搜索
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.ok(approvalService.pageOutward(customerName, page, size)); //业务逻辑在Service，Controller 只负责接收请求
    }

    @PostMapping("/outward") //创建外出申请 查询 GET；新增 POST；修改 PUT；删除	DELETE
    public Result<Outward> createOutward(@RequestBody Outward outward) { //接收前端传来的 JSON，Spring 自动转成Outward对象
        return Result.ok(approvalService.createOutward(outward));
    }

    @PutMapping("/outward/{id}/audit") //PUT /api/approval/outward/1/audit
    public Result<Void> auditOutward(
            @PathVariable Integer id,  //获取URL id
            @RequestParam boolean pass, //审核通过/驳回
            @AuthenticationPrincipal LoginUser user) { //使用 Spring Security 做权限认证，获取当前登录用户信息
        approvalService.auditOutward(id, pass, user.getUser().getNickname()); //获取昵称
        return Result.ok();
    }

    @PutMapping("/outward/{id}/return") //登记归来
    public Result<Void> registerReturn(
            @PathVariable Integer id,
            @RequestParam java.time.LocalDate actualReturnTime) { //实际返回时间 /LocalDate是Java8新时间API，线程安全，替代旧Date类
        approvalService.registerOutwardReturn(id, actualReturnTime);
        return Result.ok();
    }

    @GetMapping("/backdown")  //退住
    public Result<Page<Backdown>> backdownPage(
            @RequestParam(required = false) String customerName,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.ok(approvalService.pageBackdown(customerName, page, size));
    }

    @PostMapping("/backdown")
    public Result<Backdown> createBackdown(@RequestBody Backdown backdown) {
        return Result.ok(approvalService.createBackdown(backdown));
    }

    @PutMapping("/backdown/{id}/audit")
    public Result<Void> auditBackdown(
            @PathVariable Integer id,
            @RequestParam boolean pass,
            @AuthenticationPrincipal LoginUser user) {
        approvalService.auditBackdown(id, pass, user.getUser().getNickname());
        return Result.ok();
    }
}

/**
 * 外出审批流程
 * 1. 前端提交外出申请
   2. Controller接收请求
   3. Service保存数据库
   4. 管理员查看申请列表
   5. 管理员审核
   6. 系统记录审批人
   7. 老人回来后登记归来时间
 */