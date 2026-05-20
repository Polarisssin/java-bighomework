package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;

@Data
@TableName("customernurseitem")
public class CustomerNurseItem {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer itemId;
    private Integer customerId;
    private Integer levelId;
    private Integer nurseNumber;
    private Integer isDeleted;
    private LocalDate buyTime;
    private LocalDate maturityTime;

    @TableField(exist = false)
    private String nursingName;
    @TableField(exist = false)
    private String serialNumber;
    @TableField(exist = false)
    private String servicePrice;
    @TableField(exist = false)
    private String levelName;
}
