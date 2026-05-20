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

    private final NurseContentMapper contentMapper;
    private final NurseLevelMapper levelMapper;
    private final CustomerNurseItemService customerNurseItemService;

    @GetMapping("/content")
    public Result<Page<NurseContent>> contentPage(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<NurseContent> qw = new LambdaQueryWrapper<NurseContent>()
                .eq(NurseContent::getIsDeleted, 0)
                .eq(status != null, NurseContent::getStatus, status)
                .like(StringUtils.hasText(name), NurseContent::getNursingName, name);
        return Result.ok(contentMapper.selectPage(new Page<>(page, size), qw));
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
        level.setIsDeleted(0);
        levelMapper.insert(level);
        return Result.ok(level);
    }

    @PutMapping("/level/{id}")
    public Result<NurseLevel> updateLevel(@PathVariable Integer id, @RequestBody NurseLevel level) {
        level.setId(id);
        levelMapper.updateById(level);
        return Result.ok(level);
    }

    @GetMapping("/customer-items")
    public Result<java.util.List<CustomerNurseItem>> customerItems(@RequestParam Integer customerId) {
        return Result.ok(customerNurseItemService.listByCustomer(customerId));
    }

    @PostMapping("/customer-items")
    public Result<CustomerNurseItem> addCustomerItem(@RequestBody CustomerNurseItem item) {
        return Result.ok(customerNurseItemService.create(item));
    }

    @PutMapping("/customer-items/{id}")
    public Result<CustomerNurseItem> updateCustomerItem(@PathVariable Integer id, @RequestBody CustomerNurseItem item) {
        item.setId(id);
        return Result.ok(customerNurseItemService.update(item));
    }

    @DeleteMapping("/customer-items/{id}")
    public Result<Void> deleteCustomerItem(@PathVariable Integer id) {
        customerNurseItemService.delete(id);
        return Result.ok();
    }

    @PutMapping("/customer/{customerId}/level")
    public Result<Void> setCustomerLevel(@PathVariable Integer customerId, @RequestBody java.util.Map<String, Integer> body) {
        customerNurseItemService.setCustomerLevel(customerId, body.get("levelId"));
        return Result.ok();
    }
}
