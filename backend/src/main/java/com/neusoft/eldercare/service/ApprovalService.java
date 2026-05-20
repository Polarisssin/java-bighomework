package com.neusoft.eldercare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.neusoft.eldercare.entity.Backdown;
import com.neusoft.eldercare.entity.Bed;
import com.neusoft.eldercare.entity.Customer;
import com.neusoft.eldercare.entity.Outward;
import com.neusoft.eldercare.mapper.BackdownMapper;
import com.neusoft.eldercare.mapper.BedMapper;
import com.neusoft.eldercare.mapper.CustomerMapper;
import com.neusoft.eldercare.mapper.OutwardMapper;
import com.neusoft.eldercare.security.LoginUser;
import com.neusoft.eldercare.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final OutwardMapper outwardMapper;
    private final BackdownMapper backdownMapper;
    private final CustomerMapper customerMapper;
    private final BedMapper bedMapper;

    public Page<Outward> pageOutward(String customerName, Integer submitUserId, LoginUser loginUser, int page, int size) {
        LambdaQueryWrapper<Outward> qw = new LambdaQueryWrapper<Outward>()
                .eq(Outward::getIsDeleted, 0)
                .orderByDesc(Outward::getId);
        if (SecurityUtils.isCaregiver(loginUser)) {
            qw.eq(Outward::getSubmitUserId, loginUser.getUser().getId());
        } else if (submitUserId != null) {
            qw.eq(Outward::getSubmitUserId, submitUserId);
        }
        return outwardMapper.selectPage(new Page<>(page, size), qw);
    }

    @Transactional
    public void auditOutward(Integer id, boolean pass, String auditor) {
        Outward o = outwardMapper.selectById(id);
        if (o == null) {
            throw new IllegalArgumentException("记录不存在");
        }
        o.setAuditstatus(pass ? 1 : 2);
        o.setAuditperson(auditor);
        o.setAudittime(LocalDateTime.now());
        outwardMapper.updateById(o);
        if (pass) {
            Customer c = customerMapper.selectById(o.getCustomerId());
            if (c != null && c.getBedId() != null) {
                Bed bed = bedMapper.selectById(c.getBedId());
                if (bed != null) {
                    bed.setBedStatus(3);
                    bedMapper.updateById(bed);
                }
            }
        }
    }

    public Page<Backdown> pageBackdown(String customerName, Integer submitUserId, LoginUser loginUser, int page, int size) {
        LambdaQueryWrapper<Backdown> qw = new LambdaQueryWrapper<Backdown>()
                .eq(Backdown::getIsDeleted, 0)
                .orderByDesc(Backdown::getId);
        if (SecurityUtils.isCaregiver(loginUser)) {
            qw.eq(Backdown::getSubmitUserId, loginUser.getUser().getId());
        } else if (submitUserId != null) {
            qw.eq(Backdown::getSubmitUserId, submitUserId);
        }
        return backdownMapper.selectPage(new Page<>(page, size), qw);
    }

    @Transactional
    public void auditBackdown(Integer id, boolean pass, String auditor) {
        Backdown b = backdownMapper.selectById(id);
        if (b == null) {
            throw new IllegalArgumentException("记录不存在");
        }
        b.setAuditstatus(pass ? 1 : 2);
        b.setAuditperson(auditor);
        b.setAudittime(LocalDateTime.now());
        backdownMapper.updateById(b);
        if (pass) {
            Customer c = customerMapper.selectById(b.getCustomerId());
            if (c != null) {
                if (b.getRetreattype() == 0 || b.getRetreattype() == 1) {
                    if (c.getBedId() != null) {
                        Bed bed = bedMapper.selectById(c.getBedId());
                        if (bed != null) {
                            bed.setBedStatus(1);
                            bedMapper.updateById(bed);
                        }
                        c.setBedId(null);
                    }
                }
                c.setResidentStatus(2);
                customerMapper.updateById(c);
            }
        }
    }

    public Outward createOutward(Outward outward, LoginUser loginUser) {
        SecurityUtils.assertCaregiverOwnsCustomer(customerMapper, outward.getCustomerId());
        outward.setAuditstatus(0);
        outward.setIsDeleted(0);
        if (outward.getSubmitUserId() == null) {
            outward.setSubmitUserId(loginUser.getUser().getId());
        }
        outwardMapper.insert(outward);
        return outward;
    }

    public Backdown createBackdown(Backdown backdown, LoginUser loginUser) {
        SecurityUtils.assertCaregiverOwnsCustomer(customerMapper, backdown.getCustomerId());
        backdown.setAuditstatus(0);
        backdown.setIsDeleted(0);
        if (backdown.getSubmitUserId() == null) {
            backdown.setSubmitUserId(loginUser.getUser().getId());
        }
        backdownMapper.insert(backdown);
        return backdown;
    }

    public void registerOutwardReturn(Integer id, java.time.LocalDate actualReturnTime) {
        Outward o = outwardMapper.selectById(id);
        if (o == null) {
            throw new IllegalArgumentException("记录不存在");
        }
        o.setActualreturntime(actualReturnTime);
        outwardMapper.updateById(o);
        Customer c = customerMapper.selectById(o.getCustomerId());
        if (c != null && c.getBedId() != null) {
            Bed bed = bedMapper.selectById(c.getBedId());
            if (bed != null && bed.getBedStatus() == 3) {
                bed.setBedStatus(2);
                bedMapper.updateById(bed);
            }
        }
    }
}
