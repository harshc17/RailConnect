-- RailConnect Database Schema
-- IRCTC-style Train Reservation System

-- Create database
CREATE DATABASE IF NOT EXISTS railconnect;
USE railconnect;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Railway stations table (200+ major stations)
CREATE TABLE railway_stations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zone VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trains table
CREATE TABLE trains (
    id INT PRIMARY KEY AUTO_INCREMENT,
    number VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    from_station VARCHAR(10) NOT NULL,
    to_station VARCHAR(10) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration VARCHAR(10) NOT NULL,
    days JSON NOT NULL, -- Array of days when train runs
    type ENUM('Express', 'Superfast', 'Rajdhani', 'Shatabdi', 'Duronto', 'Mail') NOT NULL,
    zone VARCHAR(10) NOT NULL,
    distance INT NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_station) REFERENCES railway_stations(code),
    FOREIGN KEY (to_station) REFERENCES railway_stations(code)
);

-- Train classes and pricing
CREATE TABLE train_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    train_id INT NOT NULL,
    class_code VARCHAR(5) NOT NULL, -- 1A, 2A, 3A, SL, CC, EC
    class_name VARCHAR(50) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
    UNIQUE KEY unique_train_class (train_id, class_code)
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pnr VARCHAR(10) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    train_id INT NOT NULL,
    journey_date DATE NOT NULL,
    class_code VARCHAR(5) NOT NULL,
    total_passengers INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('confirmed', 'waiting', 'cancelled', 'completed') DEFAULT 'waiting',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id),
    INDEX idx_pnr (pnr),
    INDEX idx_user_id (user_id),
    INDEX idx_journey_date (journey_date)
);

-- Passengers table
CREATE TABLE passengers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    seat_number VARCHAR(10),
    berth_preference ENUM('Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper', 'No Preference') DEFAULT 'No Preference',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('booking', 'cancellation', 'refund') NOT NULL,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'pending',
    payment_method ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet') NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_booking_id (booking_id)
);

-- Train schedules (for different dates)
CREATE TABLE train_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    train_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    status ENUM('on_time', 'delayed', 'cancelled') DEFAULT 'on_time',
    delay_minutes INT DEFAULT 0,
    platform_number VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains(id),
    UNIQUE KEY unique_train_date (train_id, schedule_date)
);

-- Seat availability tracking
CREATE TABLE seat_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    train_id INT NOT NULL,
    class_code VARCHAR(5) NOT NULL,
    journey_date DATE NOT NULL,
    available_seats INT NOT NULL,
    booked_seats INT NOT NULL,
    waiting_list INT NOT NULL,
    rac_seats INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains(id),
    UNIQUE KEY unique_train_class_date (train_id, class_code, journey_date)
);

-- Admin logs for audit trail
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Insert sample admin user
INSERT INTO users (name, email, phone, password_hash, role) VALUES 
('Admin User', 'admin@railconnect.com', '+91 9876543210', '$2b$10$example_hash', 'admin');

-- Insert major railway stations
INSERT INTO railway_stations (code, name, state, zone) VALUES
('NDLS', 'NEW DELHI', 'Delhi', 'NR'),
('HWH', 'HOWRAH', 'West Bengal', 'ER'),
('MAS', 'MGR Chennai Central', 'Tamil Nadu', 'SR'),
('SC', 'SECUNDERABAD', 'Telangana', 'SCR'),
('NZM', 'HAZRAT NIZAMUDDIN JN', 'Delhi', 'NR'),
('LTT', 'Lokmanya Tilak Terminus', 'Maharashtra', 'CR'),
('ADI', 'Ahmedabad', 'Gujarat', 'WR'),
('CSMT', 'Mumbai CSMT', 'Maharashtra', 'CR'),
('PUNE', 'Pune', 'Maharashtra', 'CR'),
('ANVT', 'ANAND VIHAR TERMINAL', 'Delhi', 'NR'),
('ST', 'Surat', 'Gujarat', 'WR'),
('SBC', 'KSR BENGALURU', 'Karnataka', 'SWR'),
('PNBE', 'Patna Jn', 'Bihar', 'ECR'),
('JP', 'JAIPUR', 'Rajasthan', 'NWR'),
('DLI', 'DELHI JN', 'Delhi', 'NR'),
('MS', 'Chennai Egmore', 'Tamil Nadu', 'SR'),
('GKP', 'Gorakhpur Jn', 'Uttar Pradesh', 'NER'),
('VSKP', 'VISAKHAPATNAM', 'Andhra Pradesh', 'ECOR'),
('BSB', 'VARANASI', 'Uttar Pradesh', 'NR'),
('NGP', 'Nagpur', 'Maharashtra', 'CR'),
('BZA', 'VIJAYAWADA', 'Andhra Pradesh', 'SCR'),
('KYN', 'Kalyan', 'Maharashtra', 'CR'),
('MMCT', 'Mumbai Central', 'Maharashtra', 'WR'),
('BBS', 'BHUBANESWAR', 'Odisha', 'ECOR'),
('SDAH', 'SEALDAH', 'West Bengal', 'ER'),
('JAT', 'JAMMU TAWI', 'Jammu And Kashmir', 'NR'),
('BDTS', 'Bandra Terminus', 'Maharashtra', 'WR'),
('TPTY', 'TIRUPATI', 'Andhra Pradesh', 'SCR'),
('SMVB', 'SMVT Benglure', 'Karnataka', 'SWR'),
('BPL', 'BHOPAL JN', 'Madhya Pradesh', 'WCR'),
('LKO', 'LUCKNOW', 'Uttar Pradesh', 'NR'),
('CNB', 'KANPUR CENTRAL', 'Uttar Pradesh', 'NCR'),
('PRYJ', 'PRAYAGRAJ JN', 'Uttar Pradesh', 'NCR'),
('YPR', 'YESVANTPUR', 'Karnataka', 'SWR'),
('INDB', 'Indore', 'Madhya Pradesh', 'WR'),
('BRC', 'Vadodara', 'Gujarat', 'WR'),
('NJP', 'New Jalpaiguri', 'West Bengal', 'NFR'),
('GHY', 'Guwahati', 'Assam', 'NFR'),
('CBE', 'Coimbatore jn', 'Tamil Nadu', 'SR'),
('JBP', 'JABALPUR', 'Madhya Pradesh', 'WCR'),
('AII', 'Ajmer', 'Rajasthan', 'NWR'),
('R', 'Raipur', 'Chhattisgarh', 'SECR'),
('JU', 'JODHPUR JN', 'Rajasthan', 'NWR'),
('LJN', 'Lucknow jn', 'Uttar Pradesh', 'NER'),
('HW', 'HARIDWAR JN', 'Uttrakhand', 'NR'),
('KCG', 'KACHEGUDA', 'Telangana', 'SCR'),
('ASR', 'AMRITSAR Jn', 'Punjab', 'NR'),
('SHM', 'Shalimar', 'West Bengal', 'SER'),
('VGLJ', 'V laxmibi Jhansi Jn', 'Uttar Pradesh', 'NCR'),
('GWL', 'Gwalior Jn', 'Madhya Pradesh', 'NCR'),
('KOTA', 'KOTA JN', 'Rajasthan', 'WCR'),
('TVC', 'Tiruvananthapuram central', 'Kerala', 'SR'),
('TNA', 'Thane', 'Maharashtra', 'CR'),
('DNR', 'Danapur', 'Bihar', 'ECR'),
('MFP', 'Muzaffarpur Jn', 'Bihar', 'ECR'),
('RNC', 'Ranchi', 'Jharkhand', 'SER'),
('AGC', 'AGRA CANTT', 'Uttar Pradesh', 'NCR'),
('CDG', 'CHANDIGARH', 'Chandigarh UT', 'NR'),
('DDU', 'PtDeen Dayal Upadhyaya Jn', 'Uttar Pradesh', 'ECR'),
('UJN', 'Ujjain', 'Madhya Pradesh', 'WR'),
('PURI', 'PURI', 'Odisha', 'ECOR'),
('TBM', 'Tambaram', 'Tamil Nadu', 'SR'),
('ERS', 'Ernakulam jn', 'Kerala', 'SR'),
('BSBS', 'Banaras', 'Uttar Pradesh', 'NER'),
('GAYA', 'Gaya', 'Bihar', 'ECR'),
('LDH', 'LUDHIANA Jn', 'Punjab', 'NR'),
('MTJ', 'MATHURA JN', 'Uttar Pradesh', 'NCR'),
('DR', 'Dadar', 'Maharashtra', 'CR'),
('MDU', 'Madurai jn', 'Tamil Nadu', 'SR'),
('DEE', 'DELHI SARAI ROHILLA', 'Delhi', 'NR'),
('HYB', 'HYDERABAD', 'Telangana', 'SCR'),
('UMB', 'AMBALA CANTT JN', 'Haryana', 'NR'),
('SVDK', 'SHRI MATA VAISHNO DEVI KATRA', 'Jammu And Kashmir', 'NR'),
('DHN', 'Dhanbad Jn', 'Jharkhand', 'ECR'),
('KOAA', 'KOLKATA', 'West Bengal', 'ER'),
('TATA', 'Tatanagar', 'Jharkhand', 'SER'),
('NK', 'Nasik Road', 'Maharashtra', 'CR'),
('CLT', 'Kozhikkode', 'Kerala', 'SR'),
('PNVL', 'Panvel', 'Maharashtra', 'CR'),
('RKMP', 'RANI KAMALAPATI', 'Madhya Pradesh', 'WCR'),
('NED', 'HAZUR SAHIB NANDED', 'Maharashtra', 'SCR'),
('KGP', 'Kharagpur', 'West Bengal', 'SER'),
('RJT', 'Rajkot', 'Gujarat', 'WR'),
('GZB', 'GHAZIABAD JN', 'Uttar Pradesh', 'NR'),
('DBG', 'Darbhanga', 'Bihar', 'ECR'),
('ASN', 'ASANSOL', 'West Bengal', 'ER'),
('BSP', 'Bilaspur', 'Chhattisgarh', 'SECR'),
('TPJ', 'Tiruchchirappalli jn', 'Tamil Nadu', 'SR'),
('TCR', 'Thrisur', 'Kerala', 'SR'),
('KIR', 'Katihar', 'Bihar', 'NFR'),
('CPR', 'Chhapra Jn', 'Bihar', 'NER'),
('BGP', 'BHAGALPUR', 'Bihar', 'ER');
-- Insert train classes and pricing
INSERT INTO train_classes (train_id, class_code, class_name, base_price, total_seats, available_seats) VALUES
-- Rajdhani Express classes
(1, '1A', 'AC First Class', 5055.00, 20, 8),
(1, '2A', 'AC 2 Tier', 2955.00, 30, 12),
(1, '3A', 'AC 3 Tier', 1995.00, 50, 23),
(2, '1A', 'AC First Class', 5055.00, 20, 5),
(2, '2A', 'AC 2 Tier', 2955.00, 30, 9),
(2, '3A', 'AC 3 Tier', 1995.00, 50, 18),
(3, '1A', 'AC First Class', 5055.00, 20, 6),
(3, '2A', 'AC 2 Tier', 2955.00, 30, 15),
(3, '3A', 'AC 3 Tier', 1995.00, 50, 28),
(4, '1A', 'AC First Class', 5055.00, 20, 4),
(4, '2A', 'AC 2 Tier', 2955.00, 30, 11),
(4, '3A', 'AC 3 Tier', 1995.00, 50, 22),

-- Shatabdi Express classes
(5, 'CC', 'Chair Car', 1895.00, 60, 45),
(5, 'EC', 'Executive Class', 2855.00, 20, 16),
(6, 'CC', 'Chair Car', 1895.00, 60, 38),
(6, 'EC', 'Executive Class', 2855.00, 20, 12),
(7, 'CC', 'Chair Car', 1895.00, 60, 42),
(7, 'EC', 'Executive Class', 2855.00, 20, 18),
(8, 'CC', 'Chair Car', 1895.00, 60, 35),
(8, 'EC', 'Executive Class', 2855.00, 20, 14),

-- Duronto Express classes
(9, '1A', 'AC First Class', 4555.00, 20, 15),
(9, '2A', 'AC 2 Tier', 2655.00, 30, 21),
(9, '3A', 'AC 3 Tier', 1795.00, 50, 34),
(10, '1A', 'AC First Class', 4555.00, 20, 12),
(10, '2A', 'AC 2 Tier', 2655.00, 30, 18),
(10, '3A', 'AC 3 Tier', 1795.00, 50, 29),

-- Superfast Express classes
(11, '1A', 'AC First Class', 4555.00, 20, 8),
(11, '2A', 'AC 2 Tier', 2655.00, 30, 15),
(11, '3A', 'AC 3 Tier', 1795.00, 50, 28),
(11, 'SL', 'Sleeper', 755.00, 80, 45),
(12, '1A', 'AC First Class', 4555.00, 20, 6),
(12, '2A', 'AC 2 Tier', 2655.00, 30, 12),
(12, '3A', 'AC 3 Tier', 1795.00, 50, 25),
(12, 'SL', 'Sleeper', 755.00, 80, 38),
(13, '1A', 'AC First Class', 4555.00, 20, 5),
(13, '2A', 'AC 2 Tier', 2655.00, 30, 18),
(13, '3A', 'AC 3 Tier', 1795.00, 50, 32),
(13, 'SL', 'Sleeper', 755.00, 80, 52),
(14, '1A', 'AC First Class', 4555.00, 20, 7),
(14, '2A', 'AC 2 Tier', 2655.00, 30, 15),
(14, '3A', 'AC 3 Tier', 1795.00, 50, 28),
(14, 'SL', 'Sleeper', 755.00, 80, 48),

-- Express classes
(15, '2A', 'AC 2 Tier', 2655.00, 30, 12),
(15, '3A', 'AC 3 Tier', 1795.00, 50, 25),
(15, 'SL', 'Sleeper', 755.00, 80, 42),
(16, '2A', 'AC 2 Tier', 2655.00, 30, 10),
(16, '3A', 'AC 3 Tier', 1795.00, 50, 22),
(16, 'SL', 'Sleeper', 755.00, 80, 38),
(17, '2A', 'AC 2 Tier', 2655.00, 30, 8),
(17, '3A', 'AC 3 Tier', 1795.00, 50, 18),
(17, 'SL', 'Sleeper', 755.00, 80, 35),
(18, '2A', 'AC 2 Tier', 2655.00, 30, 6),
(18, '3A', 'AC 3 Tier', 1795.00, 50, 15),
(18, 'SL', 'Sleeper', 755.00, 80, 32),
(19, '2A', 'AC 2 Tier', 2655.00, 30, 9),
(19, '3A', 'AC 3 Tier', 1795.00, 50, 20),
(19, 'SL', 'Sleeper', 755.00, 80, 40),
(20, '2A', 'AC 2 Tier', 2655.00, 30, 7),
(20, '3A', 'AC 3 Tier', 1795.00, 50, 18),
(20, 'SL', 'Sleeper', 755.00, 80, 36),
(21, '2A', 'AC 2 Tier', 2655.00, 30, 11),
(21, '3A', 'AC 3 Tier', 1795.00, 50, 24),
(21, 'SL', 'Sleeper', 755.00, 80, 45),
(22, '2A', 'AC 2 Tier', 2655.00, 30, 9),
(22, '3A', 'AC 3 Tier', 1795.00, 50, 21),
(22, 'SL', 'Sleeper', 755.00, 80, 42),
(23, '2A', 'AC 2 Tier', 2655.00, 30, 8),
(23, '3A', 'AC 3 Tier', 1795.00, 50, 19),
(23, 'SL', 'Sleeper', 755.00, 80, 38),
(24, '2A', 'AC 2 Tier', 2655.00, 30, 6),
(24, '3A', 'AC 3 Tier', 1795.00, 50, 16),
(24, 'SL', 'Sleeper', 755.00, 80, 35),
(25, '2A', 'AC 2 Tier', 2655.00, 30, 7),
(25, '3A', 'AC 3 Tier', 1795.00, 50, 17),
(25, 'SL', 'Sleeper', 755.00, 80, 33),
(26, '2A', 'AC 2 Tier', 2655.00, 30, 5),
(26, '3A', 'AC 3 Tier', 1795.00, 50, 15),
(26, 'SL', 'Sleeper', 755.00, 80, 30),
(27, '2A', 'AC 2 Tier', 2655.00, 30, 6),
(27, '3A', 'AC 3 Tier', 1795.00, 50, 16),
(27, 'SL', 'Sleeper', 755.00, 80, 32),
(28, '2A', 'AC 2 Tier', 2655.00, 30, 4),
(28, '3A', 'AC 3 Tier', 1795.00, 50, 14),
(28, 'SL', 'Sleeper', 755.00, 80, 28),
(29, '2A', 'AC 2 Tier', 2655.00, 30, 8),
(29, '3A', 'AC 3 Tier', 1795.00, 50, 18),
(29, 'SL', 'Sleeper', 755.00, 80, 35),
(30, '2A', 'AC 2 Tier', 2655.00, 30, 6),
(30, '3A', 'AC 3 Tier', 1795.00, 50, 16),
(30, 'SL', 'Sleeper', 755.00, 80, 32);

-- Create indexes for better performance
CREATE INDEX idx_trains_from_to ON trains(from_station, to_station);
CREATE INDEX idx_trains_type ON trains(type);
CREATE INDEX idx_bookings_date ON bookings(journey_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_seat_availability_date ON seat_availability(journey_date);

-- Create views for common queries
CREATE VIEW train_availability AS
SELECT 
    t.id,
    t.number,
    t.name,
    t.from_station,
    t.to_station,
    t.departure_time,
    t.arrival_time,
    t.duration,
    t.type,
    tc.class_code,
    tc.class_name,
    tc.base_price,
    tc.available_seats,
    tc.total_seats
FROM trains t
JOIN train_classes tc ON t.id = tc.train_id
WHERE t.status = 'active';

CREATE VIEW booking_summary AS
SELECT 
    b.id,
    b.pnr,
    u.name as user_name,
    u.email as user_email,
    t.name as train_name,
    t.number as train_number,
    b.journey_date,
    b.class_code,
    b.total_passengers,
    b.total_amount,
    b.status,
    b.booking_date
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN trains t ON b.train_id = t.id;

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetAvailableTrains(
    IN from_station VARCHAR(10),
    IN to_station VARCHAR(10),
    IN journey_date DATE
)
BEGIN
    SELECT 
        t.id,
        t.number,
        t.name,
        t.from_station,
        t.to_station,
        t.departure_time,
        t.arrival_time,
        t.duration,
        t.type,
        tc.class_code,
        tc.class_name,
        tc.base_price,
        tc.available_seats,
        tc.total_seats
    FROM trains t
    JOIN train_classes tc ON t.id = tc.train_id
    WHERE t.from_station = from_station 
    AND t.to_station = to_station
    AND t.status = 'active'
    AND tc.available_seats > 0
    ORDER BY t.departure_time;
END //

CREATE PROCEDURE UpdateSeatAvailability(
    IN train_id INT,
    IN class_code VARCHAR(5),
    IN journey_date DATE,
    IN seats_to_book INT
)
BEGIN
    UPDATE seat_availability 
    SET available_seats = available_seats - seats_to_book,
        booked_seats = booked_seats + seats_to_book
    WHERE train_id = train_id 
    AND class_code = class_code 
    AND journey_date = journey_date;
END //

DELIMITER ;

-- Insert initial seat availability data
INSERT INTO seat_availability (train_id, class_code, journey_date, available_seats, booked_seats, waiting_list, rac_seats)
SELECT 
    tc.train_id,
    tc.class_code,
    CURDATE() + INTERVAL (a.n) DAY as journey_date,
    tc.available_seats,
    tc.total_seats - tc.available_seats,
    0,
    0
FROM train_classes tc
CROSS JOIN (
    SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION 
    SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION 
    SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION 
    SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION 
    SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION 
    SELECT 30
) a
WHERE a.n <= 30; -- 30 days advance booking
