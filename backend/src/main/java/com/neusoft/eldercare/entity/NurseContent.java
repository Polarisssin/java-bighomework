package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("nursecontent")
public class NurseContent {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String serialNumber;
    private String nursingName;
    private String servicePrice;
    private String message;
    private Integer status;
    private String executionCycle;
    private String executionTimes;
    private Integer isDeleted;
}
