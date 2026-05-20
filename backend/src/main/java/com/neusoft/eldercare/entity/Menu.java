package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("menu")
public class Menu {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String menusIndex;
    private String title;
    private String icon;
    private String path;
    private Integer parentId;
}
