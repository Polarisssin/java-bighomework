package com.neusoft.eldercare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.entity.CustomerNurseItem;
import com.neusoft.eldercare.entity.NurseContent;
import com.neusoft.eldercare.entity.NurseLevel;
import com.neusoft.eldercare.mapper.CustomerMapper;
import com.neusoft.eldercare.mapper.CustomerNurseItemMapper;
import com.neusoft.eldercare.mapper.NurseContentMapper;
import com.neusoft.eldercare.mapper.NurseLevelMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerNurseItemService {

    private final CustomerNurseItemMapper itemMapper;
    private final NurseContentMapper contentMapper;
    private final NurseLevelMapper levelMapper;
    private final CustomerMapper customerMapper;

    public List<CustomerNurseItem> listByCustomer(Integer customerId) {
        List<CustomerNurseItem> list = itemMapper.selectList(
                new LambdaQueryWrapper<CustomerNurseItem>()
                        .eq(CustomerNurseItem::getCustomerId, customerId)
                        .eq(CustomerNurseItem::getIsDeleted, 0)
                        .orderByDesc(CustomerNurseItem::getId));
        list.forEach(this::enrich);
        return list;
    }

    public CustomerNurseItem create(CustomerNurseItem item) {
        item.setIsDeleted(0);
        itemMapper.insert(item);
        enrich(item);
        return item;
    }

    public CustomerNurseItem update(CustomerNurseItem item) {
        itemMapper.updateById(item);
        enrich(item);
        return item;
    }

    public void delete(Integer id) {
        CustomerNurseItem item = itemMapper.selectById(id);
        if (item != null) {
            item.setIsDeleted(1);
            itemMapper.updateById(item);
        }
    }

    public void setCustomerLevel(Integer customerId, Integer levelId) {
        Customer c = customerMapper.selectById(customerId);
        if (c == null || c.getIsDeleted() == 1) {
            throw new IllegalArgumentException("客户不存在");
        }
        c.setLevelId(levelId);
        customerMapper.updateById(c);
    }

    private void enrich(CustomerNurseItem item) {
        if (item.getItemId() != null) {
            NurseContent nc = contentMapper.selectById(item.getItemId());
            if (nc != null) {
                item.setNursingName(nc.getNursingName());
                item.setSerialNumber(nc.getSerialNumber());
                item.setServicePrice(nc.getServicePrice());
            }
        }
        if (item.getLevelId() != null) {
            NurseLevel nl = levelMapper.selectById(item.getLevelId());
            if (nl != null) {
                item.setLevelName(nl.getLevelName());
            }
        }
    }
}
