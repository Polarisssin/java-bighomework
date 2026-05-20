package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("outward")
public class Outward {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String remarks;
    private Integer isDeleted;
    private Integer customerId;
    private String outgoingreason;
    private LocalDate outgoingtime;
    private LocalDate expectedreturntime;
    private LocalDate actualreturntime;
    private String escorted;
    private String relation;
    private String escortedtel;
    private Integer auditstatus;
    private String auditperson;
    private LocalDateTime audittime;
    private Integer submitUserId;
}
