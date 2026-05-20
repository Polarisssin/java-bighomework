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