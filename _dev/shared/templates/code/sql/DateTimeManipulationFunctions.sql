-- ---------------------------------------------------------------------
-- Get Current Date and Time
-- ---------------------------------------------------------------------

SELECT NOW();       -- Current date and time
SELECT CURDATE();   -- Current date
SELECT CURTIME();   -- Current time

-- ---------------------------------------------------------------------
-- Extract Date/Time Parts
-- ---------------------------------------------------------------------

SELECT
    YEAR(date_column) AS year_part,
    MONTH(date_column) AS month_part,
    DAY(date_column) AS day_part,
    HOUR(datetime_column) AS hour_part,
    MINUTE(datetime_column) AS minute_part,
    SECOND(datetime_column) AS second_part
FROM your_table_name;

 --Get names
 SELECT DAYNAME('2024-07-04'); --Returns Thursday
 SELECT MONTHNAME('2024-07-04'); --Returns July

-- ---------------------------------------------------------------------
-- Date Arithmetic
-- ---------------------------------------------------------------------

SELECT DATE_ADD(date_column, INTERVAL 1 DAY) AS tomorrow
FROM your_table_name;

SELECT DATE_SUB(date_column, INTERVAL 1 WEEK) AS last_week
FROM your_table_name;

 --Calculate difference between dates
 SELECT DATEDIFF('2024-01-05', '2024-01-01'); --Returns 4

 --Get timestamp difference
 SELECT TIMESTAMPDIFF(MINUTE, '2024-01-05 12:00:00', '2024-01-05 13:30:00'); -- Returns 90

-- ---------------------------------------------------------------------
-- Date Formatting
-- ---------------------------------------------------------------------
 --See: https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html#function_date-format for format specifiers
SELECT DATE_FORMAT(date_column, '%Y-%m-%d') AS formatted_date
FROM your_table_name;

SELECT DATE_FORMAT(datetime_column, '%W %M %e %Y %H:%i:%s') AS formatted_datetime -- e.g., "Thursday October 24 2024 18:34:22"
FROM your_table_name;

 --Convert String to Date
 SELECT STR_TO_DATE('October 24, 2024', '%M %d, %Y');