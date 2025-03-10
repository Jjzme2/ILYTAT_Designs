-- ---------------------------------------------------------------------
-- Insert data into a table.
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. List columns in parentheses (column1, column2...).
-- 3. Provide corresponding values in VALUES().
-- 4. Execute the script.
-- ---------------------------------------------------------------------

INSERT INTO your_table_name (column1, column2, column3)
VALUES ('value1', 123, '2023-10-27');

-- Example: Insert multiple rows
INSERT INTO your_table_name (column1, column2)
VALUES
    ('value1', 1),
    ('value2', 2),
    ('value3', 3);


-- ---------------------------------------------------------------------
-- Select data from a table with a WHERE clause.
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. List columns to select (or use * for all).
-- 3. Modify the WHERE clause.
-- 4. (Optional) Add ORDER BY and LIMIT.
-- 5. Execute the script.
-- ---------------------------------------------------------------------

SELECT *  -- Or list specific columns: column1, column2
FROM your_table_name
WHERE column1 = 'some_value'  -- Modify the WHERE clause as needed
-- Optional: Add ORDER BY and LIMIT
-- ORDER BY column2 DESC
-- LIMIT 10
;

-- ---------------------------------------------------------------------
-- Update data in a table (BE CAREFUL - always use a WHERE clause!).
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Set column values: column1 = 'new_value', column2 = column2 + 1.
-- 3. *ALWAYS* include a WHERE clause to specify which rows to update.
-- 4. Execute the script.
-- ---------------------------------------------------------------------

UPDATE your_table_name
SET column1 = 'new_value', column2 = 123
WHERE id = 5;  --  *VERY IMPORTANT* - Specify which rows to update

-- ---------------------------------------------------------------------
-- Delete data from a table (BE CAREFUL - always use a WHERE clause!).
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. *ALWAYS* include a WHERE clause to specify which rows to delete.
-- 3. Execute the script.
-- ---------------------------------------------------------------------

DELETE FROM your_table_name
WHERE id = 5;  -- *VERY IMPORTANT* - Specify which rows to delete