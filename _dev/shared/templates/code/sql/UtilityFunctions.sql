-- ---------------------------------------------------------------------
-- Get all indexes for a given table.
--
-- Usage:
-- 1. Replace 'your_database_name' with the name of your database.
-- 2. Replace 'your_table_name' with the name of your table.
-- 3. Execute the script.
-- ---------------------------------------------------------------------

SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,        -- The position of the column within the index (starting at 1)
    NON_UNIQUE,          -- 0 if the index enforces uniqueness, 1 otherwise.
    INDEX_TYPE,         -- BTREE, FULLTEXT, HASH, RTREE
    COLLATION,         -- Collation of index 'A' (Ascending) or NULL
    CARDINALITY,       -- An estimate of the number of unique values in the index.
    SUB_PART,          -- The index prefix length,  NULL if the entire column is indexed.
    PACKED,            -- Indicates how the key is packed. NULL if it is not.
    NULLABLE,           -- 'YES' if the column may contain NULL values, '' otherwise.
    INDEX_COMMENT,
    COMMENT
FROM
    INFORMATION_SCHEMA.STATISTICS
WHERE
    TABLE_SCHEMA = 'your_database_name'  -- Replace with your database name
    AND TABLE_NAME = 'your_table_name'     -- Replace with your table name
ORDER BY
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX;

-- ---------------------------------------------------------------------
-- List all tables in a database
--
-- Usage:
-- 1. Replace 'your_database_name' with the database name.
-- 2. Execute.
-- ---------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'your_database_name';

-- ---------------------------------------------------------------------
-- Get column information for a table
--
-- Usage:
-- 1. Replace 'your_database_name' with the database name.
-- 2. Replace 'your_table_name' with the table name
-- 3. Execute
-- ---------------------------------------------------------------------

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE,
    EXTRA
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'your_database_name'
    AND TABLE_NAME = 'your_table_name';

-- ---------------------------------------------------------------------
-- Check if a table exists
-- Usage:
-- 1.  Replace 'your_database_name' with the name of the database.
-- 2.  Replace 'your_table_name' with the name of the table to check.
-- 3. Execute. A result of 1 means the table exists, 0 means it doesn't.
-- ---------------------------------------------------------------------
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'your_database_name'
    AND table_name = 'your_table_name'
) AS table_exists;

-- ---------------------------------------------------------------------
-- List all databases
-- Usage:
-- Execute the command
-- ---------------------------------------------------------------------

SHOW DATABASES;

-- ---------------------------------------------------------------------
-- Get current database
-- Usage:
-- Execute the command
-- ---------------------------------------------------------------------
SELECT DATABASE();