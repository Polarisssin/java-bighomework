package com.neusoft.eldercare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.neusoft.eldercare.entity.Bed;
import com.neusoft.eldercare.entity.BedDetails;
import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.entity.Room;
import com.neusoft.eldercare.mapper.BedDetailsMapper;
import com.neusoft.eldercare.mapper.BedMapper;
import com.neusoft.eldercare.mapper.CustomerMapper;
import com.neusoft.eldercare.mapper.RoomMapper;
import com.neusoft.eldercare.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BedService {

    private final BedMapper bedMapper;
    private final RoomMapper roomMapper;
    private final BedDetailsMapper bedDetailsMapper;
    private final CustomerMapper customerMapper;

    public Map<String, Object> statistics() {
        List<Bed> beds = bedMapper.selectList(null);
        long total = beds.size();
        long free = beds.stream().filter(b -> b.getBedStatus() == 1).count();
        long occupied = beds.stream().filter(b -> b.getBedStatus() == 2).count();
        long out = beds.stream().filter(b -> b.getBedStatus() == 3).count();
        Map<String, Object> map = new HashMap<>();
        map.put("total", total);
        map.put("free", free);
        map.put("occupied", occupied);
        map.put("out", out);
        return map;
    }

    public List<Map<String, Object>> diagram(String floor) {
        if (floor == null || floor.isBlank()) {
            floor = "1";
        }
        String finalFloor = floor;
        List<Room> rooms = roomMapper.selectList(new LambdaQueryWrapper<Room>()
                .eq(Room::getRoomFloor, finalFloor)
                .orderByAsc(Room::getRoomNo));
        return rooms.stream().map(room -> {
            List<Bed> beds = bedMapper.selectList(new LambdaQueryWrapper<Bed>().eq(Bed::getRoomNo, room.getRoomNo()));
            Map<String, Object> item = new HashMap<>();
            item.put("room", room);
            item.put("beds", beds);
            return item;
        }).collect(Collectors.toList());
    }

    public List<Bed> freeBedsByRoom(Integer roomNo) {
        LambdaQueryWrapper<Bed> qw = new LambdaQueryWrapper<Bed>().eq(Bed::getBedStatus, 1);
        if (roomNo != null) {
            qw.eq(Bed::getRoomNo, roomNo);
        }
        return bedMapper.selectList(qw.orderByAsc(Bed::getRoomNo, Bed::getBedNo));
    }

    public Map<String, Object> overview() {
        List<Bed> beds = bedMapper.selectList(
                new LambdaQueryWrapper<Bed>().orderByAsc(Bed::getRoomNo, Bed::getBedNo));
        List<Customer> customers = customerMapper.selectList(
                new LambdaQueryWrapper<Customer>().eq(Customer::getIsDeleted, 0));
        Map<Integer, Customer> customerByBedId = customers.stream()
                .filter(c -> c.getBedId() != null)
                .collect(Collectors.toMap(Customer::getBedId, c -> c, (a, b) -> a));

        List<Map<String, Object>> occupied = new java.util.ArrayList<>();
        List<Map<String, Object>> free = new java.util.ArrayList<>();
        for (Bed bed : beds) {
            Map<String, Object> row = bedRow(bed);
            if (bed.getBedStatus() == 1) {
                free.add(row);
            } else {
                Customer c = customerByBedId.get(bed.getId());
                row.put("customerId", c != null ? c.getId() : null);
                row.put("customerName", c != null ? c.getCustomerName() : "-");
                occupied.add(row);
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("statistics", statistics());
        result.put("occupied", occupied);
        result.put("free", free);
        return result;
    }

    private Map<String, Object> bedRow(Bed bed) {
        String floor = roomMapper.selectList(new LambdaQueryWrapper<Room>().eq(Room::getRoomNo, bed.getRoomNo()))
                .stream()
                .findFirst()
                .map(Room::getRoomFloor)
                .orElse("");
        Map<String, Object> row = new HashMap<>();
        row.put("bedId", bed.getId());
        row.put("roomNo", bed.getRoomNo());
        row.put("floor", floor);
        row.put("bedNo", bed.getBedNo());
        row.put("bedStatus", bed.getBedStatus());
        row.put("bedStatusLabel", bed.getBedStatus() == 1 ? "空闲" : bed.getBedStatus() == 2 ? "有人" : "外出");
        row.put("bedLabel", bed.getRoomNo() + "-" + bed.getBedNo());
        return row;
    }

    @Transactional
    public void swapBed(Integer customerId, Integer newBedId) {
        SecurityUtils.assertCaregiverOwnsCustomer(customerMapper, customerId);
        Customer customer = customerMapper.selectById(customerId);
        if (customer == null || customer.getIsDeleted() == 1) {
            throw new IllegalArgumentException("客户不存在");
        }
        Bed newBed = bedMapper.selectById(newBedId);
        if (newBed == null || newBed.getBedStatus() != 1) {
            throw new IllegalArgumentException("目标床位不可用");
        }
        LocalDate today = LocalDate.now();
        if (customer.getBedId() != null) {
            Bed oldBed = bedMapper.selectById(customer.getBedId());
            bedDetailsMapper.selectList(new LambdaQueryWrapper<BedDetails>()
                            .eq(BedDetails::getCustomerId, customerId)
                            .eq(BedDetails::getUseStatus, 1)
                            .eq(BedDetails::getIsDeleted, 0))
                    .forEach(d -> {
                        d.setUseStatus(2);
                        d.setEndDate(today);
                        bedDetailsMapper.updateById(d);
                    });
            if (oldBed != null) {
                oldBed.setBedStatus(1);
                bedMapper.updateById(oldBed);
            }
        }
        newBed.setBedStatus(2);
        bedMapper.updateById(newBed);

        BedDetails details = new BedDetails();
        details.setCustomerId(customerId);
        details.setBedId(newBedId);
        details.setStartDate(today);
        details.setEndDate(customer.getExpirationDate());
        details.setUseStatus(1);
        details.setIsDeleted(0);
        details.setBedDetails("床位调换");
        bedDetailsMapper.insert(details);

        customer.setBedId(newBedId);
        customer.setRoomNo(String.valueOf(newBed.getRoomNo()));
        customerMapper.updateById(customer);
    }
}
