-- ---------------------------------------------------------------------
-- Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
--
-- Usage:
-- 1. Replace 'your_table_name' with the table name.
-- 2. Modify the SELECT list to include desired aggregate functions.
-- 3. (Optional) Add a WHERE clause for filtering.
-- 4. (Optional) Add a GROUP BY clause for grouping.
-- ---------------------------------------------------------------------

SELECT
    COUNT(*) AS total_rows,  -- Count of all rows
    SUM(column1) AS sum_of_column1,
    AVG(column2) AS average_of_column2,
    MIN(column3) AS minimum_of_column3,
    MAX(column3) AS maximum_of_column3
FROM your_table_name
-- WHERE some_condition  -- Optional filtering
-- GROUP BY column4      -- Optional grouping
;

-- ---------------------------------------------------------------------
-- GROUP BY with HAVING (filtering aggregated results)
--
-- Usage:
-- 1. Replace 'your_table_name' with the table.
-- 2. Modify the SELECT list and GROUP BY clause.
-- 3. Add a HAVING clause to filter based on aggregate function results.
-- ---------------------------------------------------------------------

SELECT
    column1,
    COUNT(*) AS count_per_group
FROM your_table_name
GROUP BY column1
HAVING COUNT(*) > 10  -- Filter groups where count is greater than 10
;
  -- ---------------------------------------------------------------------
-- Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD)
--
-- Usage:
-- 1. Replace 'your_table_name' with the table.
-- 2. Modify the SELECT list to include desired window functions.
-- 3. Define the OVER() clause with PARTITION BY and ORDER BY.
-- ---------------------------------------------------------------------

SELECT
 column1,
 column2,
 ROW_NUMBER() OVER (ORDER BY column2 DESC) AS row_num, --Sequential number
 RANK() OVER (ORDER BY column2 DESC) AS rank_num,   --Rank with gaps
 DENSE_RANK() OVER(ORDER BY column2 DESC) as dense_rank_num, --Rank without gaps
 LAG(column2, 1, 0) OVER (ORDER BY column2) AS previous_value, -- Value of previous row
 LEAD(column2, 1, 0) OVER (ORDER BY column2) AS next_value       -- Value of next value
 FROM your_table_name;

 -- Example with PARTITION BY
    SELECT
     column1,
     column2,
     ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY column2 DESC) AS row_num_within_group
     FROM your_table_name;