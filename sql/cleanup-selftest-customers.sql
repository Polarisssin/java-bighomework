-- 清理接口自测时写入的临时客户（自测A / 自测B / 自测C；乱码名请手工核对后删除）
SET NAMES utf8mb4;

UPDATE bed b
INNER JOIN customer c ON c.bed_id = b.id
SET b.bed_status = 1
WHERE c.customer_name LIKE '自测%';

UPDATE beddetails bd
INNER JOIN customer c ON c.id = bd.customer_id
SET bd.use_status = 2, bd.end_date = CURDATE()
WHERE c.customer_name LIKE '自测%' AND bd.use_status = 1;

DELETE o FROM outward o
INNER JOIN customer c ON c.id = o.customer_id
WHERE c.customer_name LIKE '自测%';

DELETE b FROM backdown b
INNER JOIN customer c ON c.id = b.customer_id
WHERE c.customer_name LIKE '自测%';

DELETE cni FROM customernurseitem cni
INNER JOIN customer c ON c.id = cni.customer_id
WHERE c.customer_name LIKE '自测%';

DELETE nr FROM nurserecord nr
INNER JOIN customer c ON c.id = nr.customer_id
WHERE c.customer_name LIKE '自测%';

DELETE bd FROM beddetails bd
INNER JOIN customer c ON c.id = bd.customer_id
WHERE c.customer_name LIKE '自测%';

DELETE c FROM customer c
WHERE c.customer_name LIKE '自测%';
