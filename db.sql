CREATE DATABASE IF NOT EXISTS google_maps_scraping;

USE google_maps_scraping;

CREATE TABLE IF NOT EXISTS businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    place_id VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    category VARCHAR(255),
    phone VARCHAR(50),
    google_url TEXT,
    biz_website TEXT,
    rating_text VARCHAR(255),
    stars FLOAT,
    number_of_reviews INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
