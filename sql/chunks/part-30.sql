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