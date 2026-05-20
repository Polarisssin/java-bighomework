-- 东软颐养中心管理系统 - 数据库初始化
-- MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS elder_care DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elder_care;

DROP TABLE IF EXISTS meal;
DROP TABLE IF EXISTS customerpreference;
DROP TABLE IF EXISTS food;
DROP TABLE IF EXISTS backdown;
DROP TABLE IF EXISTS outward;
DROP TABLE IF EXISTS customernurseitem;
DROP TABLE IF EXISTS nurserecord;
DROP TABLE IF EXISTS nurselevelitem;
DROP TABLE IF EXISTS nurselevel;
DROP TABLE IF EXISTS nursecontent;
DROP TABLE IF EXISTS rolemenu;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS beddetails;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS bed;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS role;

-- 角色表
CREATE TABLE role (
  id INT PRIMARY KEY AUTO_INCREMENT,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NULL,
  update_by INT NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  name VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- 用户表
CREATE TABLE user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  create_by INT NULL,
  update_time DATETIME NULL,
  update_by INT NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  nickname VARCHAR(20) NOT NULL,
  username VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  sex INT NOT NULL DEFAULT 1,
  email VARCHAR(254) NULL,
  phone_number VARCHAR(20) NOT NULL,
  role_id INT NOT NULL,
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(id)
) ENGINE=InnoDB;

-- 房间表
CREATE TABLE room (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_floor VARCHAR(10) NOT NULL,
  room_no INT NOT NULL,
  UNIQUE KEY uk_room (room_floor, room_no)
) ENGINE=InnoDB;

-- 床位表 bed_status: 1空闲 2有人 3外出
CREATE TABLE bed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_no INT NOT NULL,
  bed_status INT NOT NULL DEFAULT 1,
  remarks VARCHAR(255) NULL,
  bed_no VARCHAR(20) NOT NULL,
  room_id INT NULL,
  KEY idx_bed_room (room_no)
) ENGINE=InnoDB;

-- 客户表
CREATE TABLE customer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  is_deleted INT NOT NULL DEFAULT 0,
  resident_status INT NOT NULL DEFAULT 1 COMMENT '1在住 2已退住',
  customer_name VARCHAR(20) NOT NULL,
  customer_age INT NOT NULL,
  customer_sex INT NOT NULL COMMENT '0男 1女',
  idcard VARCHAR(20) NOT NULL,
  room_no VARCHAR(20) NOT NULL,
  building_no VARCHAR(11) NOT NULL DEFAULT '606',
  checkin_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  contact_tel VARCHAR(20) NOT NULL,
  bed_id INT NULL,
  psychosomatic_state VARCHAR(255) NULL,
  attention VARCHAR(255) NULL,
  birthday DATE NULL,
  height VARCHAR(20) NULL,
  weight VARCHAR(20) NULL,
  blood_type VARCHAR(20) NOT NULL,
  filepath VARCHAR(50) NOT NULL DEFAULT '/avatar/default.png',
  user_id INT NULL DEFAULT -1 COMMENT '健康管家ID，-1无管家',
  level_id INT NULL,
  family_member VARCHAR(20) NULL,
  KEY idx_customer_name (customer_name),
  KEY idx_customer_bed (bed_id)
) ENGINE=InnoDB;

-- 床位使用详情
CREATE TABLE beddetails (
  id INT PRIMARY KEY AUTO_INCREMENT,
  start_date DATE NULL,
  end_date DATE NULL,
  bed_details VARCHAR(255) NULL,
  customer_id INT NULL,
  bed_id INT NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  use_status INT NOT NULL DEFAULT 1 COMMENT '1正在使用 2历史',
  KEY idx_bd_customer (customer_id)
) ENGINE=InnoDB;

-- 菜单
CREATE TABLE menu (
  id INT PRIMARY KEY AUTO_INCREMENT,
  menus_index VARCHAR(5) NULL,
  title VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'Menu',
  path VARCHAR(100) NULL,
  parent_id INT NULL
) ENGINE=InnoDB;

CREATE TABLE rolemenu (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  menu_id INT NOT NULL
) ENGINE=InnoDB;

-- 护理内容
CREATE TABLE nursecontent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  serial_number VARCHAR(20) NOT NULL,
  nursing_name VARCHAR(55) NOT NULL,
  service_price VARCHAR(55) NOT NULL,
  message VARCHAR(100) NULL,
  status INT NOT NULL DEFAULT 1 COMMENT '1启用 2停用',
  execution_cycle VARCHAR(20) NULL,
  execution_times VARCHAR(20) NULL,
  is_deleted INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- 护理级别
CREATE TABLE nurselevel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  level_name VARCHAR(20) NOT NULL,
  level_status INT NOT NULL DEFAULT 1,
  is_deleted INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE nurselevelitem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  level_id INT NOT NULL,
  item_id INT NOT NULL
) ENGINE=InnoDB;

-- 护理记录
CREATE TABLE nurserecord (
  id INT PRIMARY KEY AUTO_INCREMENT,
  is_deleted INT NOT NULL DEFAULT 0,
  customer_id INT NOT NULL,
  item_id INT NOT NULL,
  nursing_time DATETIME NOT NULL,
  nursing_content VARCHAR(255) NULL,
  nursing_count INT NOT NULL,
  user_id INT NOT NULL
) ENGINE=InnoDB;

-- 客户护理项目
CREATE TABLE customernurseitem (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  customer_id INT NOT NULL,
  level_id INT NULL,
  nurse_number INT NOT NULL DEFAULT 1,
  is_deleted INT NOT NULL DEFAULT 0,
  buy_time DATE NOT NULL,
  maturity_time DATE NOT NULL
) ENGINE=InnoDB;

-- 外出登记
CREATE TABLE outward (
  id INT PRIMARY KEY AUTO_INCREMENT,
  remarks VARCHAR(100) NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  customer_id INT NOT NULL,
  outgoingreason VARCHAR(100) NOT NULL,
  outgoingtime DATE NOT NULL,
  expectedreturntime DATE NOT NULL,
  actualreturntime DATE NULL,
  escorted VARCHAR(50) NULL,
  relation VARCHAR(50) NULL,
  escortedtel VARCHAR(50) NULL,
  auditstatus INT NOT NULL DEFAULT 0 COMMENT '0已提交 1同意 2拒绝',
  auditperson VARCHAR(50) NULL,
  audittime DATETIME NULL
) ENGINE=InnoDB;

-- 退住登记
CREATE TABLE backdown (
  id INT PRIMARY KEY AUTO_INCREMENT,
  remarks VARCHAR(100) NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  customer_id INT NOT NULL,
  retreattime DATE NOT NULL,
  retreattype INT NOT NULL COMMENT '0正常 1死亡 2保留床位',
  retreatreason VARCHAR(100) NULL,
  auditstatus INT NOT NULL DEFAULT 0,
  auditperson VARCHAR(50) NULL,
  audittime DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE food (
  id INT PRIMARY KEY AUTO_INCREMENT,
  food_name VARCHAR(30) NULL,
  food_type VARCHAR(30) NULL,
  price DECIMAL(10,2) NULL,
  is_halal INT NULL,
  food_img VARCHAR(100) NULL
) ENGINE=InnoDB;

CREATE TABLE customerpreference (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NULL,
  preferences VARCHAR(30) NULL,
  attention VARCHAR(30) NULL,
  remark VARCHAR(30) NULL,
  is_deleted INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE meal (
  id INT PRIMARY KEY AUTO_INCREMENT,
  week_day VARCHAR(10) NOT NULL,
  food_id INT NULL,
  meal_type INT NULL COMMENT '1早 2午 3晚',
  taste VARCHAR(30) NULL,
  is_deleted INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ========== 初始数据 ==========

INSERT INTO role (id, name) VALUES (1, '系统管理员'), (2, '健康管家');

-- 密码均为明文账号（实训环境）；生产请改为 BCrypt
INSERT INTO user (nickname, username, password, sex, phone_number, role_id, create_by) VALUES
('管理员', 'admin', 'admin', 1, '13800000001', 1, 1),
('管理员一', 'admin1', 'admin1', 1, '13800000002', 1, 1),
('管理员二', 'admin2', 'admin2', 0, '13800000003', 1, 1),
('张管家', 'nurse01', 'nurse01', 0, '13900000001', 2, 1),
('李管家', 'nurse02', 'nurse02', 1, '13900000002', 2, 1);

-- 楼栋固定 606，示例房间与床位
INSERT INTO room (room_floor, room_no) VALUES
('1', 101), ('1', 102), ('1', 103),
('2', 201), ('2', 202),
('3', 301);

INSERT INTO bed (room_no, bed_no, bed_status, room_id) VALUES
(101, 'A', 1, 1), (101, 'B', 1, 1),
(102, 'A', 1, 2), (102, 'B', 1, 2),
(103, 'A', 1, 3),
(201, 'A', 1, 4), (201, 'B', 1, 4),
(202, 'A', 1, 5),
(301, 'A', 1, 6), (301, 'B', 1, 6);

-- 菜单（管理员）
INSERT INTO menu (id, menus_index, title, icon, path, parent_id) VALUES
(1, '1', '客户管理', 'User', NULL, NULL),
(2, '1', '入住登记', 'House', '/customer/checkin', 1),
(3, '1', '退住登记', 'Remove', '/customer/backdown', 1),
(4, '1', '外出登记', 'Position', '/customer/outward', 1),
(5, '2', '床位管理', 'Grid', NULL, NULL),
(6, '2', '床位示意图', 'DataBoard', '/bed/diagram', 5),
(7, '2', '床位管理', 'Tickets', '/bed/manage', 5),
(8, '3', '护理管理', 'FirstAidKit', NULL, NULL),
(9, '3', '护理项目', 'List', '/nurse/content', 8),
(10, '3', '护理级别', 'Rank', '/nurse/level', 8),
(11, '3', '客户护理设置', 'Setting', '/nurse/customer-setting', 8),
(12, '3', '护理记录', 'Document', '/nurse/record', 8),
(13, '4', '健康管家', 'Avatar', NULL, NULL),
(14, '4', '设置服务对象', 'Connection', '/health/assign', 13),
(15, '4', '服务关注', 'View', '/health/service', 13),
(16, '5', '用户管理', 'UserFilled', '/user/manage', NULL),
(17, '6', '健康管家', 'Suitcase', NULL, NULL),
(18, '6', '日常护理', 'EditPen', '/caregiver/daily', 17),
(19, '6', '护理记录', 'Notebook', '/caregiver/record', 17),
(20, '7', '客户管理', 'User', NULL, NULL),
(21, '7', '外出申请', 'Promotion', '/caregiver/outward', 20),
(22, '7', '退住申请', 'Back', '/caregiver/backdown', 20);

INSERT INTO rolemenu (role_id, menu_id)
SELECT 1, id FROM menu WHERE id <= 16;
INSERT INTO rolemenu (role_id, menu_id)
SELECT 2, id FROM menu WHERE id >= 17;

INSERT INTO nursecontent (serial_number, nursing_name, service_price, message, status, execution_cycle, execution_times) VALUES
('N001', '血压测量', '10', '每日血压监测', 1, '每日', '1'),
('N002', '康复训练', '50', '肢体康复', 1, '每周', '3'),
('N003', '助浴服务', '80', '洗浴协助', 1, '每周', '2'),
('N004', '心理疏导', '30', '心理关怀', 1, '每周', '1');

INSERT INTO nurselevel (level_name, level_status) VALUES
('一级护理', 1), ('二级护理', 1), ('三级护理', 2);

INSERT INTO nurselevelitem (level_id, item_id) VALUES
(1, 1), (1, 2), (2, 1), (2, 3);

INSERT INTO food (food_name, food_type, price, is_halal) VALUES
('小米粥', '主食', 5.00, 0),
('清蒸鱼', '荤菜', 18.00, 0),
('炒青菜', '素菜', 8.00, 0);
