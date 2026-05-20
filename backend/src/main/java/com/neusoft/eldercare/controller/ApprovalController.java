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

@Tag(name = "审批")
@RestController
@RequestMapping("/api/approval")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping("/outward")
    public Result<Page<Outward>> outwardPage(
            @RequestParam(required = false) String customerName,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.ok(approvalService.pageOutward(customerName, page, size));
    }

    @PostMapping("/outward")
    public Result<Outward> createOutward(@RequestBody Outward outward) {
        return Result.ok(approvalService.createOutward(outward));
    }

    @PutMapping("/outward/{id}/audit")
    public Result<Void> auditOutward(
            @PathVariable Integer id,
            @RequestParam boolean pass,
            @AuthenticationPrincipal LoginUser user) {
        approvalService.auditOutward(id, pass, user.getUser().getNickname());
        return Result.ok();
    }

    @PutMapping("/outward/{id}/return")
    public Result<Void> registerReturn(
            @PathVariable Integer id,
            @RequestParam java.time.LocalDate actualReturnTime) {
        approvalService.registerOutwardReturn(id, actualReturnTime);
        return Result.ok();
    }

    @GetMapping("/backdown")
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
