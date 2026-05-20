package com.neusoft.eldercare.dto;

import com.neusoft.eldercare.entity.SysUser;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserVo {
    private Integer id;
    private LocalDateTime createTime;
    private Integer createBy;
    private LocalDateTime updateTime;
    private Integer updateBy;
    private Integer isDeleted;
    private String nickname;
    private String username;
    private Integer sex;
    private String email;
    private String phoneNumber;
    private Integer roleId;

    public static UserVo from(SysUser user) {
        if (user == null) {
            return null;
        }
        UserVo vo = new UserVo();
        vo.setId(user.getId());
        vo.setCreateTime(user.getCreateTime());
        vo.setCreateBy(user.getCreateBy());
        vo.setUpdateTime(user.getUpdateTime());
        vo.setUpdateBy(user.getUpdateBy());
        vo.setIsDeleted(user.getIsDeleted());
        vo.setNickname(user.getNickname());
        vo.setUsername(user.getUsername());
        vo.setSex(user.getSex());
        vo.setEmail(user.getEmail());
        vo.setPhoneNumber(user.getPhoneNumber());
        vo.setRoleId(user.getRoleId());
        return vo;
    }
}
