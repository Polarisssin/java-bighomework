package com.neusoft.eldercare.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.entity.CustomerNurseItem;
import com.neusoft.eldercare.entity.NurseContent;
import com.neusoft.eldercare.entity.NurseLevel;
import com.neusoft.eldercare.mapper.NurseContentMapper;
import com.neusoft.eldercare.mapper.NurseLevelMapper;
import com.neusoft.eldercare.service.CustomerNurseItemService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@Tag(name = "护理管理")
@RestController
@RequestMapping("/api/nurse")
@RequiredArgsConstructor
public class NurseController {

    private final NurseContentMapper contentMapper; //注入护理内容数据层访问对象
    private final NurseLevelMapper levelMapper; //护理等级
    private final CustomerNurseItemService customerNurseItemService; //护理业务

    @GetMapping("/content")
    public Result<Page<NurseContent>> contentPage( // 统一响应封装类，包含状态码、消息和数据
            @RequestParam(required = false) String name, //模糊护理项目名
            @RequestParam(required = false) Integer status, //启用/禁用护理
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<NurseContent> qw = new LambdaQueryWrapper<NurseContent>()
                .eq(NurseContent::getIsDeleted, 0) //只查未删除的
                .eq(status != null, NurseContent::getStatus, status)//status不为空，按状态过滤
                .like(StringUtils.hasText(name), NurseContent::getNursingName, name);//模糊搜索名
        return Result.ok(contentMapper.selectPage(new Page<>(page, size), qw));
        /**使用了 MyBatis-Plus 的 LambdaQueryWrapper 来构建 SQL 的 WHERE 子句，
         * 特点是类型安全（使用 lambda 表达式引用字段，避免写错列名）和动态拼接 */
    }

    @PostMapping("/content")
    public Result<NurseContent> addContent(@RequestBody NurseContent c) {
        c.setIsDeleted(0);
        contentMapper.insert(c);
        return Result.ok(c);
    }

    @PutMapping("/content/{id}")
    public Result<NurseContent> updateContent(@PathVariable Integer id, @RequestBody NurseContent c) {
        c.setId(id);
        contentMapper.updateById(c);
        return Result.ok(c);
    }

    @DeleteMapping("/content/{id}")
    public Result<Void> deleteContent(@PathVariable Integer id) {
        NurseContent c = contentMapper.selectById(id);
        c.setIsDeleted(1);
        contentMapper.updateById(c);
        return Result.ok();
    }

    @GetMapping("/level")
    public Result<Page<NurseLevel>> levelPage(
            @RequestParam(required = false, defaultValue = "1") Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<NurseLevel> qw = new LambdaQueryWrapper<NurseLevel>()
                .eq(NurseLevel::getIsDeleted, 0)
                .eq(status != null, NurseLevel::getLevelStatus, status);
        return Result.ok(levelMapper.selectPage(new Page<>(page, size), qw));
    }

    @PostMapping("/level")
    public Result<NurseLevel> addLevel(@RequestBody NurseLevel level) {
        level.setIsDeleted(0); //未删除状态
        levelMapper.insert(level);
        return Result.ok(level);
    }//增

    @PutMapping("/level/{id}")
    public Result<NurseLevel> updateLevel(@PathVariable Integer id, @RequestBody NurseLevel level) { //强制使用URL
        level.setId(id);
        levelMapper.updateById(level);
        return Result.ok(level);
    }//改护理等级

    @GetMapping("/customer-items")
    public Result<java.util.List<CustomerNurseItem>> customerItems(@RequestParam Integer customerId) {
        return Result.ok(customerNurseItemService.listByCustomer(customerId));
    }

    @PostMapping("/customer-items")
    public Result<CustomerNurseItem> addCustomerItem(@RequestBody CustomerNurseItem item) {
        return Result.ok(customerNurseItemService.create(item));
    }//查询客户名下的护理项目明细，调用Service层的listByCustomer

    @PutMapping("/customer-items/{id}")
    public Result<CustomerNurseItem> updateCustomerItem(@PathVariable Integer id, @RequestBody CustomerNurseItem item) {
        item.setId(id); //安全绑定
        return Result.ok(customerNurseItemService.update(item));
    }//修改客户的护理项目

    @DeleteMapping("/customer-items/{id}")
    public Result<Void> deleteCustomerItem(@PathVariable Integer id) {
        customerNurseItemService.delete(id);
        return Result.ok();
    }//移除护理任务

    @PutMapping("/customer/{customerId}/level")
    public Result<Void> setCustomerLevel(@PathVariable Integer customerId, @RequestBody java.util.Map<String, Integer> body) {
        customerNurseItemService.setCustomerLevel(customerId, body.get("levelId"));
        return Result.ok();
    }//变更护理等级
    //不独立存在，因为修改护理等级会批量产生新项目
}

/**
 * 护理管理模块
 */