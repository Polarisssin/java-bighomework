-- 将 user 表明文密码迁移为 BCrypt（默认密码仍与账号相同）
-- 在云 MySQL 控制台执行一次即可；执行后请用 admin/admin、nurse01/nurse01 等登录验证

UPDATE `user` SET password='$2b$10$.jSbWU.aIbVOfoD6Ej7C6uRxasAcr/K.GLWqa0G9Tpz4OQgiMCFf2' WHERE username='admin';
UPDATE `user` SET password='$2b$10$KWSLejtbIVfVvrTN5HQVk.jsDGbzyRKfgcsKuJPguIpIYExtu3TIG' WHERE username='admin1';
UPDATE `user` SET password='$2b$10$Y6CCnjz8K9iNonz57S5Y3uMA1DmOOIhJyPVxHgsKzrQyXsKzfn5J2' WHERE username='admin2';
UPDATE `user` SET password='$2b$10$dFDonMJPsIIj.zByYKC/LeqO.rHV.AeHx4msrUwpcXIFHTLTV..Ju' WHERE username='nurse01';
UPDATE `user` SET password='$2b$10$KE1pT9xneCj7E58M6HOqa.yRzJ/TQZRKtcTQF3j4xdAHJAh/2Baa6' WHERE username='nurse02';
