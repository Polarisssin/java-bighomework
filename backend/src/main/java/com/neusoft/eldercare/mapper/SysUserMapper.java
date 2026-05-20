package com.neusoft.eldercare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.neusoft.eldercare.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT * FROM `user` WHERE username = #{username} AND is_deleted = 0 LIMIT 1")
    SysUser findByUsername(String username);
}
