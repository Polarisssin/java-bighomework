package com.neusoft.eldercare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.neusoft.eldercare.entity.Menu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MenuMapper extends BaseMapper<Menu> {

    @Select("""
            SELECT m.* FROM menu m
            INNER JOIN rolemenu rm ON m.id = rm.menu_id
            WHERE rm.role_id = #{roleId}
            ORDER BY m.menus_index, m.id
            """)
    List<Menu> listByRoleId(Integer roleId);
}
