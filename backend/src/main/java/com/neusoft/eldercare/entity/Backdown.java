package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("backdown")
public class Backdown {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String remarks;
    private Integer isDeleted;
    private Integer customerId;
    private LocalDate retreattime;
    private Integer retreattype;
    private String retreatreason;
    private Integer auditstatus;
    private String auditperson;
    private LocalDateTime audittime;
}
