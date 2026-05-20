package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("`user`")
public class SysUser {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private LocalDateTime createTime;
    private Integer createBy;
    private LocalDateTime updateTime;
    private Integer updateBy;
    private Integer isDeleted;
    private String nickname;
    private String username;
    @JsonIgnore
    @TableField("password")
    private String password;
    private Integer sex;
    private String email;
    private String phoneNumber;
    private Integer roleId;
}
