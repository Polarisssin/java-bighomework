-- 整理云库演示数据：删除自测客户，恢复 6 位种子老人与床位状态
SET NAMES utf8mb4;

-- 1) 释放自测/乱码客户占用的床
UPDATE bed b
INNER JOIN customer c ON c.bed_id = b.id
SET b.bed_status = 1
WHERE c.id > 6 OR c.customer_name LIKE '自测%' OR c.customer_name LIKE '%?%';

-- 2) 关闭自测相关床位记录
UPDATE beddetails bd
INNER JOIN customer c ON c.id = bd.customer_id
SET bd.use_status = 2, bd.end_date = CURDATE()
WHERE c.id > 6 OR c.customer_name LIKE '自测%' OR c.customer_name LIKE '%?%';

-- 3) 删除自测及 id>6 的关联数据
DELETE o FROM outward o WHERE o.customer_id > 6;
DELETE b FROM backdown b WHERE b.customer_id > 6;
DELETE cni FROM customernurseitem cni WHERE cni.customer_id > 6;
DELETE nr FROM nurserecord nr WHERE nr.customer_id > 6;
DELETE bd FROM beddetails bd WHERE bd.customer_id > 6;
DELETE c FROM customer c WHERE c.id > 6 OR c.customer_name LIKE '自测%' OR c.customer_name LIKE '%?%';

-- 4) 恢复 6 位种子老人（与 cloud-init-data.sql 一致）
UPDATE customer SET
  customer_name='王建国', customer_age=78, customer_sex=0, idcard='210102194603150011', room_no='101',
  checkin_date='2026-01-15', expiration_date='2027-01-14', contact_tel='13811110001', bed_id=1,
  blood_type='A', user_id=4, level_id=NULL, family_member='王小明', birthday='1946-03-15',
  is_deleted=0, resident_status=1
WHERE id=1;

UPDATE customer SET
  customer_name='李秀英', customer_age=82, customer_sex=1, idcard='210102194108220022', room_no='102',
  checkin_date='2026-01-15', expiration_date='2027-01-14', contact_tel='13811110002', bed_id=3,
  blood_type='B', user_id=4, level_id=NULL, family_member='李强', birthday='1941-08-22',
  is_deleted=0, resident_status=1
WHERE id=2;

UPDATE customer SET
  customer_name='张明华', customer_age=85, customer_sex=0, idcard='210102193905100033', room_no='201',
  checkin_date='2026-02-01', expiration_date='2027-01-14', contact_tel='13811110003', bed_id=6,
  blood_type='O', user_id=4, level_id=1, family_member='张丽', birthday='1939-05-10',
  is_deleted=0, resident_status=1
WHERE id=3;

UPDATE customer SET
  customer_name='陈淑芬', customer_age=76, customer_sex=1, idcard='210102194912050044', room_no='201',
  checkin_date='2026-03-10', expiration_date='2027-01-14', contact_tel='13811110004', bed_id=7,
  blood_type='AB', user_id=-1, level_id=1, family_member='陈浩', birthday='1949-12-05',
  is_deleted=0, resident_status=1
WHERE id=4;

UPDATE customer SET
  customer_name='刘德福', customer_age=80, customer_sex=0, idcard='210102194401180055', room_no='301',
  checkin_date='2026-04-20', expiration_date='2027-01-14', contact_tel='13811110005', bed_id=9,
  blood_type='A', user_id=-1, level_id=NULL, family_member='刘洋', birthday='1944-01-18',
  is_deleted=0, resident_status=1
WHERE id=5;

UPDATE customer SET
  customer_name='赵玉兰', customer_age=74, customer_sex=1, idcard='210102195206280066', room_no='202',
  checkin_date='2026-05-08', expiration_date='2027-01-14', contact_tel='13811110006', bed_id=8,
  blood_type='B', user_id=4, level_id=2, family_member='赵敏', birthday='1952-06-28',
  is_deleted=0, resident_status=1
WHERE id=6;

-- 5) 床位：先全空闲，再标有人(2)
UPDATE bed SET bed_status = 1;
UPDATE bed SET bed_status = 2 WHERE id IN (1, 3, 6, 7, 8, 9);

-- 6) 护理购买（张明华）
DELETE FROM customernurseitem WHERE customer_id = 3;
INSERT INTO customernurseitem (item_id, customer_id, level_id, nurse_number, buy_time, maturity_time, is_deleted)
VALUES (1, 3, 1, 1, '2026-02-01', '2027-01-14', 0), (2, 3, 1, 1, '2026-02-01', '2027-01-14', 0);
