CREATE TABLE room (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_floor VARCHAR(10) NOT NULL,
  room_no INT NOT NULL,
  UNIQUE KEY uk_room (room_floor, room_no)
) ENGINE=InnoDB;