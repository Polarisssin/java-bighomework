package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("nurselevel")
public class NurseLevel {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String levelName;
    private Integer levelStatus;
    private Integer isDeleted;
}
