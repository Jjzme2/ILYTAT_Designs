-- ---------------------------------------------------------------------
-- Create a new user
-- ---------------------------------------------------------------------

CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'password';

-- ---------------------------------------------------------------------
-- Grant privileges to a user
-- ---------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON your_database.* TO 'newuser'@'localhost';

-- Grant all privileges (generally not recommended for production)
GRANT ALL PRIVILEGES ON your_database.* TO 'newuser'@'localhost';
--Grant privileges on a specific table
GRANT SELECT ON your_database.your_table TO 'newuser'@'localhost';

-- ---------------------------------------------------------------------
-- Revoke privileges from a user
-- ---------------------------------------------------------------------

REVOKE DELETE ON your_database.* FROM 'newuser'@'localhost';

-- ---------------------------------------------------------------------
-- Show grants for a user
-- ---------------------------------------------------------------------
SHOW GRANTS FOR 'newuser'@'localhost';

-- ---------------------------------------------------------------------
-- Change a user's password
-- ---------------------------------------------------------------------
SET PASSWORD FOR 'newuser'@'localhost' = 'new_password';

-- ---------------------------------------------------------------------
-- Delete a user
-- ---------------------------------------------------------------------
DROP USER 'newuser'@'localhost';

-- --------------------------------------------------------------------
-- Flush privileges (apply changes)
-- ---------------------------------------------------------------------
FLUSH PRIVILEGES;