package com.neusoft.eldercare.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.security.LoginUser;
import com.neusoft.eldercare.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "客户管理")
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "客户分页列表")
    public Result<Page<Customer>> page(
            @RequestParam(required = false) String name,
            @RequestParam(required = false, defaultValue = "all") String elderlyType,
            @RequestParam(required = false, defaultValue = "active") String residence,
            @RequestParam(required = false) Integer assignUserId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal LoginUser user) {
        return Result.ok(customerService.page(name, elderlyType, residence, assignUserId, user, page, size));
    }

    @GetMapping("/{id}")
    public Result<Customer> get(@PathVariable Integer id, @AuthenticationPrincipal LoginUser user) {
        return Result.ok(customerService.getById(id, user));
    }

    @PostMapping("/checkin")
    @Operation(summary = "入住登记")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Customer> checkin(@RequestBody Customer customer) {
        return Result.ok(customerService.checkin(customer));
    }

    @PutMapping("/{id}")
    public Result<Customer> update(
            @PathVariable Integer id,
            @RequestBody Customer customer,
            @AuthenticationPrincipal LoginUser user) {
        customer.setId(id);
        return Result.ok(customerService.update(customer, user));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Integer id, @AuthenticationPrincipal LoginUser user) {
        customerService.delete(id, user);
        return Result.ok();
    }
}
