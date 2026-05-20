package com.neusoft.eldercare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;

@Data
@TableName("customer")
public class Customer {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer isDeleted;
    /** 1在住 2已退住 */
    private Integer residentStatus;
    private String customerName;
    private Integer customerAge;
    private Integer customerSex;
    private String idcard;
    private String roomNo;
    private String buildingNo;
    private LocalDate checkinDate;
    private LocalDate expirationDate;
    private String contactTel;
    private Integer bedId;
    private String psychosomaticState;
    private String attention;
    private LocalDate birthday;
    private String height;
    private String weight;
    private String bloodType;
    private String filepath;
    private Integer userId;
    private Integer levelId;
    private String familyMember;
}
