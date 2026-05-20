package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("bed")
public class Bed {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer roomNo;
    private Integer bedStatus;
    private String remarks;
    private String bedNo;
    private Integer roomId;
}
