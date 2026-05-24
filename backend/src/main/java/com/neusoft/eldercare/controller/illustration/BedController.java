package com.neusoft.eldercare.controller;

import com.neusoft.eldercare.common.Result;
import com.neusoft.eldercare.entity.Bed;
import com.neusoft.eldercare.entity.Room;
import com.neusoft.eldercare.service.BedService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.neusoft.eldercare.mapper.RoomMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "床位管理")
@RestController
@RequestMapping("/api/beds")
@RequiredArgsConstructor //依赖注入
public class BedController {

    private final BedService bedService;
    private final RoomMapper roomMapper;

    @GetMapping("/statistics")
    public Result<Map<String, Object>> statistics() {
        return Result.ok(bedService.statistics());
    }//获取床位整体信息

    @GetMapping("/diagram")
    public Result<List<Map<String, Object>>> diagram(@RequestParam(defaultValue = "1") String floor) {
        return Result.ok(bedService.diagram(floor));
    }//指定楼层床位布局

    @GetMapping("/overview")
    @Operation(summary = "床位总览（入住老人与空闲床位）")
    public Result<Map<String, Object>> overview() {
        return Result.ok(bedService.overview());
    }

    @GetMapping("/free")
    public Result<List<Bed>> freeBeds(@RequestParam(required = false) Integer roomNo) {
        return Result.ok(bedService.freeBedsByRoom(roomNo));
    }//空闲床位

    @PostMapping("/swap")
    public Result<Void> swap(@RequestParam Integer customerId, @RequestParam Integer newBedId) {
        bedService.swapBed(customerId, newBedId);
        return Result.ok();
    }//换床，写操作-Post

    @GetMapping("/rooms")
    public Result<List<Room>> rooms() {
        return Result.ok(roomMapper.selectList(new LambdaQueryWrapper<Room>().orderByAsc(Room::getRoomFloor, Room::getRoomNo)));
    }//房间排序
}

