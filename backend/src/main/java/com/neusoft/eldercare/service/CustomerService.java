package com.neusoft.eldercare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.entity.Bed;
import com.neusoft.eldercare.entity.BedDetails;
import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.mapper.BedDetailsMapper;
import com.neusoft.eldercare.mapper.BedMapper;
import com.neusoft.eldercare.mapper.CustomerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerMapper customerMapper;
    private final BedMapper bedMapper;
    private final BedDetailsMapper bedDetailsMapper;

    public Page<Customer> page(String name, String elderlyType, String residence, int page, int size) {
        LambdaQueryWrapper<Customer> qw = new LambdaQueryWrapper<Customer>()
                .eq(Customer::getIsDeleted, 0)
                .like(StringUtils.hasText(name), Customer::getCustomerName, name)
                .orderByDesc(Customer::getId);
        if (residence == null || residence.isBlank() || "active".equals(residence)) {
            qw.eq(Customer::getResidentStatus, 1);
        } else if ("retreated".equals(residence)) {
            qw.eq(Customer::getResidentStatus, 2);
        }
        if ("nursing".equals(elderlyType)) {
            qw.isNotNull(Customer::getLevelId);
        } else if ("self".equals(elderlyType)) {
            qw.isNull(Customer::getLevelId);
        }
        return customerMapper.selectPage(new Page<>(page, size), qw);
    }

    public Customer getById(Integer id) {
        Customer c = customerMapper.selectById(id);
        if (c == null || c.getIsDeleted() == 1) {
            throw new IllegalArgumentException("客户不存在");
        }
        return c;
    }

    @Transactional
    public Customer checkin(Customer customer) {
        if (customer.getExpirationDate().isBefore(customer.getCheckinDate())) {
            throw new IllegalArgumentException("合同到期时间不能小于入住时间");
        }
        if (customer.getBirthday() != null) {
            customer.setCustomerAge(Period.between(customer.getBirthday(), LocalDate.now()).getYears());
        }
        customer.setBuildingNo("606");
        customer.setIsDeleted(0);
        customer.setResidentStatus(1);
        if (customer.getUserId() == null) {
            customer.setUserId(-1);
        }
        customerMapper.insert(customer);

        if (customer.getBedId() != null) {
            Bed bed = bedMapper.selectById(customer.getBedId());
            if (bed == null || bed.getBedStatus() != 1) {
                throw new IllegalArgumentException("床位不可用");
            }
            bed.setBedStatus(2);
            bedMapper.updateById(bed);
            customer.setRoomNo(String.valueOf(bed.getRoomNo()));

            BedDetails details = new BedDetails();
            details.setCustomerId(customer.getId());
            details.setBedId(bed.getId());
            details.setStartDate(customer.getCheckinDate());
            details.setEndDate(customer.getExpirationDate());
            details.setUseStatus(1);
            details.setIsDeleted(0);
            details.setBedDetails("入住登记");
            bedDetailsMapper.insert(details);
        }
        customerMapper.updateById(customer);
        return customer;
    }

    @Transactional
    public Customer update(Customer input) {
        Customer existing = getById(input.getId());
        if (input.getBirthday() != null) {
            input.setCustomerAge(Period.between(input.getBirthday(), LocalDate.now()).getYears());
        }
        if (input.getExpirationDate() != null && !input.getExpirationDate().equals(existing.getExpirationDate())) {
            bedDetailsMapper.selectList(new LambdaQueryWrapper<BedDetails>()
                            .eq(BedDetails::getCustomerId, existing.getId())
                            .eq(BedDetails::getUseStatus, 1)
                            .eq(BedDetails::getIsDeleted, 0))
                    .forEach(d -> {
                        d.setEndDate(input.getExpirationDate());
                        bedDetailsMapper.updateById(d);
                    });
        }
        if (input.getBedId() != null && existing.getResidentStatus() != null && existing.getResidentStatus() == 2) {
            input.setResidentStatus(1);
        }
        customerMapper.updateById(input);
        return customerMapper.selectById(input.getId());
    }

    @Transactional
    public void delete(Integer id) {
        Customer customer = getById(id);
        Integer bedId = customer.getBedId();
        if (bedId != null) {
            Bed bed = bedMapper.selectById(bedId);
            if (bed != null) {
                bed.setBedStatus(1);
                bedMapper.updateById(bed);
            }
            bedDetailsMapper.selectList(new LambdaQueryWrapper<BedDetails>()
                            .eq(BedDetails::getCustomerId, id)
                            .eq(BedDetails::getUseStatus, 1)
                            .eq(BedDetails::getIsDeleted, 0))
                    .forEach(d -> {
                        d.setIsDeleted(1);
                        bedDetailsMapper.updateById(d);
                    });
        }
        customer.setIsDeleted(1);
        customer.setResidentStatus(2);
        customer.setBedId(null);
        customerMapper.updateById(customer);
    }
}
