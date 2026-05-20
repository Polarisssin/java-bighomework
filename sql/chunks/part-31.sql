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