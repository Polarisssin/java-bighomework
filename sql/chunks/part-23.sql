CREATE TABLE bed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_no INT NOT NULL,
  bed_status INT NOT NULL DEFAULT 1,
  remarks VARCHAR(255) NULL,
  bed_no VARCHAR(20) NOT NULL,
  room_id INT NULL,
  KEY idx_bed_room (room_no)
) ENGINE=InnoDB;