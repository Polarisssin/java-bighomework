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
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS role;

CREATE TABLE role (
  id INT AUTO_INCREMENT PRIMARY KEY,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NULL,
  update_by INT NULL,
  is_deleted INT DEFAULT 0 NOT NULL,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE "user" (
  id INT AUTO_INCREMENT PRIMARY KEY,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  create_by INT NULL,
  update_time TIMESTAMP NULL,
  update_by INT NULL,
  is_deleted INT DEFAULT 0 NOT NULL,
  nickname VARCHAR(20) NOT NULL,
  username VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  sex INT DEFAULT 1 NOT NULL,
  email VARCHAR(254) NULL,
  phone_number VARCHAR(20) NOT NULL,
  role_id INT NOT NULL
);

CREATE TABLE room (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_floor VARCHAR(10) NOT NULL,
  room_no INT NOT NULL
);

CREATE TABLE bed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_no INT NOT NULL,
  bed_status INT DEFAULT 1 NOT NULL,
  remarks VARCHAR(255) NULL,
  bed_no VARCHAR(20) NOT NULL,
  room_id INT NULL
);

CREATE TABLE customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_deleted INT DEFAULT 0 NOT NULL,
  customer_name VARCHAR(20) NOT NULL,
  customer_age INT NOT NULL,
  customer_sex INT NOT NULL,
  idcard VARCHAR(20) NOT NULL,
  room_no VARCHAR(20) NOT NULL,
  building_no VARCHAR(11) DEFAULT '606' NOT NULL,
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
  filepath VARCHAR(50) DEFAULT '/avatar/default.png' NOT NULL,
  user_id INT DEFAULT -1,
  level_id INT NULL,
  family_member VARCHAR(20) NULL
);

CREATE TABLE beddetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_date DATE NULL,
  end_date DATE NULL,
  bed_details VARCHAR(255) NULL,
  customer_id INT NULL,
  bed_id INT NULL,
  is_deleted INT DEFAULT 0 NOT NULL,
  use_status INT DEFAULT 1 NOT NULL
);

CREATE TABLE menu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menus_index VARCHAR(5) NULL,
  title VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  path VARCHAR(100) NULL,
  parent_id INT NULL
);

CREATE TABLE rolemenu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  menu_id INT NOT NULL
);

CREATE TABLE nursecontent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(20) NOT NULL,
  nursing_name VARCHAR(55) NOT NULL,
  service_price VARCHAR(55) NOT NULL,
  message VARCHAR(100) NULL,
  status INT DEFAULT 1 NOT NULL,
  execution_cycle VARCHAR(20) NULL,
  execution_times VARCHAR(20) NULL,
  is_deleted INT DEFAULT 0 NOT NULL
);

CREATE TABLE nurselevel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level_name VARCHAR(20) NOT NULL,
  level_status INT DEFAULT 1 NOT NULL,
  is_deleted INT DEFAULT 0 NOT NULL
);

CREATE TABLE nurselevelitem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level_id INT NOT NULL,
  item_id INT NOT NULL
);

CREATE TABLE nurserecord (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_deleted INT DEFAULT 0 NOT NULL,
  customer_id INT NOT NULL,
  item_id INT NOT NULL,
  nursing_time TIMESTAMP NOT NULL,
  nursing_content VARCHAR(255) NULL,
  nursing_count INT NOT NULL,
  user_id INT NOT NULL
);

CREATE TABLE customernurseitem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  customer_id INT NOT NULL,
  level_id INT NULL,
  nurse_number INT DEFAULT 1 NOT NULL,
  is_deleted INT DEFAULT 0 NOT NULL,
  buy_time DATE NOT NULL,
  maturity_time DATE NOT NULL
);

CREATE TABLE outward (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remarks VARCHAR(100) NULL,
  is_deleted INT DEFAULT 0 NOT NULL,
  customer_id INT NOT NULL,
  outgoingreason VARCHAR(100) NOT NULL,
  outgoingtime DATE NOT NULL,
  expectedreturntime DATE NOT NULL,
  actualreturntime DATE NULL,
  escorted VARCHAR(50) NULL,
  relation VARCHAR(50) NULL,
  escortedtel VARCHAR(50) NULL,
  auditstatus INT DEFAULT 0 NOT NULL,
  auditperson VARCHAR(50) NULL,
  audittime TIMESTAMP NULL
);

CREATE TABLE backdown (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remarks VARCHAR(100) NULL,
  is_deleted INT DEFAULT 0 NOT NULL,
  customer_id INT NOT NULL,
  retreattime DATE NOT NULL,
  retreattype INT NOT NULL,
  retreatreason VARCHAR(100) NULL,
  auditstatus INT DEFAULT 0 NOT NULL,
  auditperson VARCHAR(50) NULL,
  audittime TIMESTAMP NULL
);
