-- 云开发 MySQL 完整初始化
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS role;

CREATE TABLE role (
  id INT PRIMARY KEY AUTO_INCREMENT,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NULL,
  update_by INT NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  name VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `user` (
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
  role_id INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE room (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_floor VARCHAR(10) NOT NULL,
  room_no INT NOT NULL,
  UNIQUE KEY uk_room (room_floor, room_no)
) ENGINE=InnoDB;

CREATE TABLE bed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_no INT NOT NULL,
  bed_status INT NOT NULL DEFAULT 1,
  remarks VARCHAR(255) NULL,
  bed_no VARCHAR(20) NOT NULL,
  room_id INT NULL,
  KEY idx_bed_room (room_no)
) ENGINE=InnoDB;

CREATE TABLE customer (
  id INT PRIMARY KEY AUTO_INCREMENT,
  is_deleted INT NOT NULL DEFAULT 0,
  customer_name VARCHAR(20) NOT NULL,
  customer_age INT NOT NULL,
  customer_sex INT NOT NULL,
  idcard VARCHAR(20) NOT NULL,
  room_no VARCHAR(20) NOT NULL,
  building_no VARCHAR(11) NOT NULL DEFAULT '606',
  checkin_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  contact_tel VARCHAR(20) NOT NULL,
  bed_id INT NULL,
  blood_type VARCHAR(20) NOT NULL,
  filepath VARCHAR(50) NOT NULL DEFAULT '/avatar/default.png',
  user_id INT NULL DEFAULT -1,
  level_id INT NULL,
  family_member VARCHAR(20) NULL,
  birthday DATE NULL,
  KEY idx_customer_name (customer_name)
) ENGINE=InnoDB;

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

CREATE TABLE nursecontent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  serial_number VARCHAR(20) NOT NULL,
  nursing_name VARCHAR(55) NOT NULL,
  service_price VARCHAR(55) NOT NULL,
  message VARCHAR(100) NULL,
  status INT NOT NULL DEFAULT 1,
  execution_cycle VARCHAR(20) NULL,
  execution_times VARCHAR(20) NULL,
  is_deleted INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

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
  auditstatus INT NOT NULL DEFAULT 0,
  auditperson VARCHAR(50) NULL,
  audittime DATETIME NULL,
  submit_user_id INT NULL
) ENGINE=InnoDB;

CREATE TABLE backdown (
  id INT PRIMARY KEY AUTO_INCREMENT,
  remarks VARCHAR(100) NULL,
  is_deleted INT NOT NULL DEFAULT 0,
  customer_id INT NOT NULL,
  retreattime DATE NOT NULL,
  retreattype INT NOT NULL,
  retreatreason VARCHAR(100) NULL,
  auditstatus INT NOT NULL DEFAULT 0,
  auditperson VARCHAR(50) NULL,
  audittime DATETIME NULL,
  submit_user_id INT NULL
) ENGINE=InnoDB;

CREATE TABLE food (
  id INT PRIMARY KEY AUTO_INCREMENT,
  food_name VARCHAR(30) NULL,
  food_type VARCHAR(30) NULL,
  price DECIMAL(10,2) NULL,
  is_halal INT NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO role (id, name) VALUES (1, '系统管理员'), (2, '健康管家');
INSERT INTO `user` (id, nickname, username, password, sex, phone_number, role_id, create_by) VALUES
(1, '管理员', 'admin', 'admin', 1, '13800000001', 1, 1),
(2, '管理员一', 'admin1', 'admin1', 1, '13800000002', 1, 1),
(3, '管理员二', 'admin2', 'admin2', 0, '13800000003', 1, 1),
(4, '张管家', 'nurse01', 'nurse01', 0, '13900000001', 2, 1),
(5, '李管家', 'nurse02', 'nurse02', 1, '13900000002', 2, 1);

INSERT INTO room (id, room_floor, room_no) VALUES
(1, '1', 101), (2, '1', 102), (3, '1', 103),
(4, '2', 201), (5, '2', 202), (6, '3', 301);

INSERT INTO bed (id, room_no, bed_no, bed_status, room_id) VALUES
(1, 101, 'A', 2, 1), (2, 101, 'B', 1, 1),
(3, 102, 'A', 2, 2), (4, 102, 'B', 1, 2),
(5, 103, 'A', 1, 3),
(6, 201, 'A', 2, 4), (7, 201, 'B', 2, 4),
(8, 202, 'A', 2, 5),
(9, 301, 'A', 2, 6), (10, 301, 'B', 1, 6);

INSERT INTO nursecontent (id, serial_number, nursing_name, service_price, message, status, execution_cycle, execution_times) VALUES
(1, 'N001', '血压测量', '10', '每日血压监测', 1, '每日', '1'),
(2, 'N002', '康复训练', '50', '肢体康复', 1, '每周', '3'),
(3, 'N003', '助浴服务', '80', '洗浴协助', 1, '每周', '2'),
(4, 'N004', '心理疏导', '30', '心理关怀', 1, '每周', '1'),
(5, 'N005', '用药提醒', '15', '按时服药', 1, '每日', '2');

INSERT INTO nurselevel (id, level_name, level_status) VALUES
(1, '一级护理', 1),
(2, '二级护理', 1),
(3, '三级护理', 1);

INSERT INTO nurselevelitem (level_id, item_id) VALUES
(1, 1), (1, 2),
(2, 3),
(3, 4), (3, 5);

INSERT INTO customer (id, customer_name, customer_age, customer_sex, idcard, room_no, checkin_date, expiration_date, contact_tel, bed_id, blood_type, user_id, level_id, family_member, birthday) VALUES
(1, '王建国', 78, 0, '210102194603150011', '101', '2026-01-15', '2027-01-14', '13811110001', 1, 'A', 4, NULL, '王小明', '1946-03-15'),
(2, '李秀英', 82, 1, '210102194108220022', '102', '2026-01-15', '2027-01-14', '13811110002', 3, 'B', 4, NULL, '李强', '1941-08-22'),
(3, '张明华', 85, 0, '210102193905100033', '201', '2026-02-01', '2027-01-14', '13811110003', 6, 'O', 4, 1, '张丽', '1939-05-10'),
(4, '陈淑芬', 76, 1, '210102194912050044', '201', '2026-03-10', '2027-01-14', '13811110004', 7, 'AB', -1, 1, '陈浩', '1949-12-05'),
(5, '刘德福', 80, 0, '210102194401180055', '301', '2026-04-20', '2027-01-14', '13811110005', 9, 'A', -1, NULL, '刘洋', '1944-01-18'),
(6, '赵玉兰', 74, 1, '210102195206280066', '202', '2026-05-08', '2027-01-14', '13811110006', 8, 'B', 4, 2, '赵敏', '1952-06-28');

INSERT INTO customernurseitem (item_id, customer_id, level_id, nurse_number, buy_time, maturity_time) VALUES
(1, 3, 1, 1, '2026-02-01', '2027-01-14'),
(2, 3, 1, 1, '2026-02-01', '2027-01-14');

INSERT INTO outward (customer_id, outgoingreason, outgoingtime, expectedreturntime, auditstatus, submit_user_id, escorted) VALUES
(1, '子女接回家过节', '2026-03-01', '2026-03-05', 1, 4, '王小明'),
(2, '医院检查', '2026-04-10', '2026-04-12', 0, 4, '李强');

INSERT INTO backdown (customer_id, retreattime, retreattype, retreatreason, auditstatus, submit_user_id) VALUES
(5, '2026-06-01', 0, '家属接回长期照料', 0, 4);

UPDATE bed SET bed_status = 3 WHERE id = 1;
