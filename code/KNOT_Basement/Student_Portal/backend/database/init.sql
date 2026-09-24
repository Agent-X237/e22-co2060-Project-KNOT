-- KNOT Database Initialization & Migration Script
-- Automatically executed on initial container startup by MySQL Docker entrypoint

CREATE DATABASE IF NOT EXISTS knot_db;
USE knot_db;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  department VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  break_start VARCHAR(50) DEFAULT '12:30 PM',
  break_end VARCHAR(50) DEFAULT '01:15 PM',
  break_slots TEXT
);
-- testing
-- 2. Create Faults Table
CREATE TABLE IF NOT EXISTS faults (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location TEXT,
  status VARCHAR(50) DEFAULT 'In Progress',
  priority VARCHAR(50) DEFAULT 'Medium',
  icon VARCHAR(50) DEFAULT 'construction',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  user_id INT,
  assigned_technician_id INT,
  photo_url LONGTEXT,
  worker_photo LONGTEXT,
  maintenance_notes TEXT,
  manager_notes TEXT,
  admin_verified BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  time_display VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  icon VARCHAR(50) DEFAULT 'meeting_room',
  user_id INT,
  assigned_lecturer VARCHAR(255),
  purpose TEXT,
  end_time VARCHAR(255),
  booking_type VARCHAR(50) DEFAULT 'AR Office',
  rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
);
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('auto_booking', 'true');

-- 5. Create Email Notifications Log Table
CREATE TABLE IF NOT EXISTS email_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  subject VARCHAR(255),
  event_type VARCHAR(50),
  message_body TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INT DEFAULT 30,
  type VARCHAR(50) DEFAULT 'Lecture Hall',
  status VARCHAR(50) DEFAULT 'Available'
);

-- Seed Default Credentials & Accounts
INSERT INTO users (id, username, password, name, role, department, email) VALUES
(1, 'e22237', '1234', 'Minhaj Ali', 'Student', 'Department of Computer Engineering', 'e22237@eng.pdn.ac.lk'),
(2, 'admin', 'adminpass', 'System Administrator', 'maintenance_admin', 'Facilities Management', 'minhaj.dssc1@gmail.com'),
(3, 'bookadmin', 'adminpass', 'Booking Administrator', 'booking_admin', 'AR Office', 'minhaj.dssc3@gmail.com'),
(4, 'lecturer1', '1234', 'Dr. Smith', 'Lecturer', 'Department of Computer Engineering', 'minhajchamodya@gmail.com'),
(5, 'alex', '1234', 'Alex Johnson', 'Technician', 'Facilities Management', 'slminsgaming@gmail.com'),
(6, 'sam', '1234', 'Sam Carter', 'Technician', 'Facilities Management', NULL)
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  name = VALUES(name),
  role = VALUES(role),
  email = VALUES(email);

-- Seed Initial Mock Faults
INSERT IGNORE INTO faults (id, title, status, priority, icon, user_id) VALUES
(1, 'Projector Room 1', 'In Progress', 'Low', 'potted_plant', 1),
(2, 'HVAC Unit B4', 'Resolved', 'Medium', 'ac_unit', 1);

-- Seed Initial Mock Bookings
INSERT IGNORE INTO bookings (id, title, time_display, status, icon, user_id, assigned_lecturer, purpose) VALUES
(1, 'EOE Hall - Engineering South', 'Tomorrow, 10:00 AM', 'Approved', 'science', 1, NULL, 'General Study'),
(2, 'DO1 - Drawing Office 1', 'Friday, 02:30 PM', 'Pending', 'corporate_fare', 1, 'Dr. Smith', 'Group Discussion');

-- Seed Initial Rooms
INSERT IGNORE INTO rooms (id, name, capacity, type, status) VALUES
(1, 'EOE Hall - Engineering South', 120, 'Lecture Hall', 'Available'),
(2, 'DO1 - Drawing Office 1', 40, 'Drawing Office', 'Available'),
(3, 'DO2 - Drawing Office 2', 40, 'Drawing Office', 'Available'),
(4, 'LH01 - Lecture Hall 01', 80, 'Lecture Hall', 'Available'),
(5, 'LH02 - Lecture Hall 02', 80, 'Lecture Hall', 'Available'),
(6, 'Seminar Room A', 50, 'Seminar Room', 'Available'),
(7, 'Seminar Room B', 50, 'Seminar Room', 'Available'),
(8, 'Computer Lab 01', 60, 'Lab', 'Available'),
(9, 'Computer Lab 02', 60, 'Lab', 'Available'),
(10, 'Electronics Lab', 45, 'Lab', 'Available');
