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