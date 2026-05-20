package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;

@Data
@TableName("beddetails")
public class BedDetails {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private LocalDate startDate;
    private LocalDate endDate;
    private String bedDetails;
    private Integer customerId;
    private Integer bedId;
    private Integer isDeleted;
    private Integer useStatus;
}
