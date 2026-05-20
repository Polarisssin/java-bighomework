package com.neusoft.eldercare;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.neusoft.eldercare.mapper")
public class ElderCareApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElderCareApplication.class, args);
    }
}
