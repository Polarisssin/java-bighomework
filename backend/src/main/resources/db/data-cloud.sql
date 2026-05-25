INSERT INTO role (id, name) VALUES (1, '系统管理员'), (2, '健康管家');

INSERT INTO "user" (nickname, username, password, sex, phone_number, role_id, create_by) VALUES
('管理员', 'admin', '$2b$10$.jSbWU.aIbVOfoD6Ej7C6uRxasAcr/K.GLWqa0G9Tpz4OQgiMCFf2', 1, '13800000001', 1, 1),
('管理员一', 'admin1', '$2b$10$KWSLejtbIVfVvrTN5HQVk.jsDGbzyRKfgcsKuJPguIpIYExtu3TIG', 1, '13800000002', 1, 1),
('管理员二', 'admin2', '$2b$10$Y6CCnjz8K9iNonz57S5Y3uMA1DmOOIhJyPVxHgsKzrQyXsKzfn5J2', 0, '13800000003', 1, 1),
('张管家', 'nurse01', '$2b$10$dFDonMJPsIIj.zByYKC/LeqO.rHV.AeHx4msrUwpcXIFHTLTV..Ju', 0, '13900000001', 2, 1),
('李管家', 'nurse02', '$2b$10$KE1pT9xneCj7E58M6HOqa.yRzJ/TQZRKtcTQF3j4xdAHJAh/2Baa6', 1, '13900000002', 2, 1);

INSERT INTO room (room_floor, room_no) VALUES ('1', 101), ('1', 102), ('1', 103), ('2', 201), ('2', 202), ('3', 301);

INSERT INTO bed (room_no, bed_no, bed_status, room_id) VALUES
(101, 'A', 1, 1), (101, 'B', 1, 1), (102, 'A', 1, 2), (102, 'B', 1, 2),
(103, 'A', 1, 3), (201, 'A', 1, 4), (201, 'B', 1, 4), (202, 'A', 1, 5), (301, 'A', 1, 6), (301, 'B', 1, 6);

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

INSERT INTO rolemenu (role_id, menu_id) SELECT 1, id FROM menu WHERE id <= 16;
INSERT INTO rolemenu (role_id, menu_id) SELECT 2, id FROM menu WHERE id >= 17;

INSERT INTO nursecontent (serial_number, nursing_name, service_price, message, status, execution_cycle, execution_times) VALUES
('N001', '血压测量', '10', '每日血压监测', 1, '每日', '1'),
('N002', '康复训练', '50', '肢体康复', 1, '每周', '3'),
('N003', '助浴服务', '80', '洗浴协助', 1, '每周', '2');

INSERT INTO nurselevel (level_name, level_status) VALUES ('一级护理', 1), ('二级护理', 1);
