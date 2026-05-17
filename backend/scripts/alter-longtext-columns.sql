-- Run in MySQL Workbench AFTER the backend has started once (tables created by Hibernate).
-- Fixes "Data too long for column" when storing base64 listing images or profile photos.

USE db_dormscout;

ALTER TABLE listings MODIFY COLUMN images LONGTEXT;
ALTER TABLE listings MODIFY COLUMN description LONGTEXT;
ALTER TABLE users MODIFY COLUMN profile_image LONGTEXT;
