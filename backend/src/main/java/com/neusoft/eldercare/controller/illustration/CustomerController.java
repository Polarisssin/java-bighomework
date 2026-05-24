package com.neusoft.eldercare.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "客户管理")
@RestController // 返回json数据，HTTP响应
@RequestMapping("/api/customers")
@RequiredArgsConstructor //依赖注入
public class CustomerController {

    private final CustomerService customerService; //依赖

    @GetMapping
    @Operation(summary = "客户分页列表")
    public Result<Page<Customer>> page(
            @RequestParam(required = false) String name,
            @RequestParam(required = false, defaultValue = "all") String elderlyType,
            @RequestParam(required = false, defaultValue = "active") String residence, //查询
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.ok(customerService.page(name, elderlyType, residence, page, size));
    }

    @GetMapping("/{id}")
    public Result<Customer> get(@PathVariable Integer id) {
        return Result.ok(customerService.getById(id));
    }//获取单个客户详情

    @PostMapping("/checkin")
    @Operation(summary = "入住登记")
    public Result<Customer> checkin(@RequestBody Customer customer) {
        return Result.ok(customerService.checkin(customer));
    }//入住登记

    @PutMapping("/{id}")
    public Result<Customer> update(@PathVariable Integer id, @RequestBody Customer customer) {
        customer.setId(id);
        return Result.ok(customerService.update(customer));
    }//修改指定ID的客户信息

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Integer id) {
        customerService.delete(id);
        return Result.ok();
    }//删除指定ID的客户
}
