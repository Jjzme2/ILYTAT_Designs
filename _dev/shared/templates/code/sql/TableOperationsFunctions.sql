-- ---------------------------------------------------------------------
-- Create a new table.
--
-- Usage:
-- 1. Replace 'your_new_table_name' with the desired table name.
-- 2. Modify the column definitions (column_name DATA_TYPE constraints).
-- 3. Execute the script.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS your_new_table_name (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column1 VARCHAR(255) NOT NULL,
    column2 INT,
    column3 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Add more columns as needed
);

-- ---------------------------------------------------------------------
-- Add a column to an existing table.
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Replace 'new_column_name' with the new column's name.
-- 3. Replace 'VARCHAR(100)' with the desired data type.
-- 4. (Optional) Add 'NOT NULL' or other constraints.
-- 5. (Optional) Use 'AFTER existing_column_name' to position the column.
-- 6. Execute the script.
-- ---------------------------------------------------------------------

ALTER TABLE your_table_name
ADD COLUMN new_column_name VARCHAR(100)  -- Replace with data type and constraints
-- Optional: Add AFTER clause
-- AFTER existing_column_name
;

-- ---------------------------------------------------------------------
-- Drop a column from a table.
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Replace 'column_to_drop' with the column to remove.
-- 3. Execute the script.
-- ---------------------------------------------------------------------

ALTER TABLE your_table_name
DROP COLUMN column_to_drop;

-- ---------------------------------------------------------------------
-- Rename a column.
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Replace 'old_column_name' with the current name.
-- 3. Replace 'new_column_name' with the new name.
-- 4. Replace 'VARCHAR(255)' with the data type (keep it the same if not changing).
-- 5. Execute the script.
-- ---------------------------------------------------------------------

ALTER TABLE your_table_name
CHANGE COLUMN old_column_name new_column_name VARCHAR(255); -- Keep data type

-- ---------------------------------------------------------------------
-- Modify a column's data type.
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Replace 'column_to_modify' with the column name.
-- 3. Replace 'NEW_DATA_TYPE' with the new data type.
-- 4. Execute the script.
-- ---------------------------------------------------------------------

ALTER TABLE your_table_name
MODIFY COLUMN column_to_modify NEW_DATA_TYPE;  --  e.g., INT, TEXT, DATE

-- ---------------------------------------------------------------------
-- Drop a table (BE CAREFUL!).
--
-- Usage:
-- 1. Replace 'your_table_name' with the table to drop.
-- 2. Execute the script.
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS your_table_name;

-- ---------------------------------------------------------------------
-- Truncate a table (remove all data, keep structure - BE CAREFUL!).
--
-- Usage:
-- 1. Replace 'your_table_name' with the table to truncate.
-- 2. Execute the script.
-- ---------------------------------------------------------------------

TRUNCATE TABLE your_table_name;

-- ---------------------------------------------------------------------
-- Get Table Definition (SHOW CREATE TABLE)
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Execute the script.
-- ---------------------------------------------------------------------

SHOW CREATE TABLE your_table_name;
-- ---------------------------------------------------------------------
-- Rename a table
-- Usage:
-- 1.  Replace 'old_table_name' with the current name of the table.
-- 2.  Replace 'new_table_name' with the desired new name for the table.
-- 3. Execute
-- ---------------------------------------------------------------------

RENAME TABLE old_table_name TO new_table_name;