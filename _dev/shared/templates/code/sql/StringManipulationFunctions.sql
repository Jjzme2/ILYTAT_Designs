-- ---------------------------------------------------------------------
-- String Concatenation
-- ---------------------------------------------------------------------

SELECT CONCAT(column1, ' ', column2) AS combined_string
FROM your_table_name;

--Using CONCAT_WS for concation with a seperator
 SELECT CONCAT_WS(', ', column1, column2, column3) AS combined_string
FROM your_table_name;

-- ---------------------------------------------------------------------
-- Substring Extraction
-- ---------------------------------------------------------------------

SELECT SUBSTRING(column1, 1, 5) AS first_five_chars  -- Extract first 5 characters
FROM your_table_name;

SELECT SUBSTRING(column1, 3) AS from_third_char --Extract from third character to the end
 FROM your_table_name;

 --Extract using position of a character
SELECT SUBSTRING_INDEX('www.example.com','.', 2); --Returns www.example

-- ---------------------------------------------------------------------
-- String Replacement
-- ---------------------------------------------------------------------

SELECT REPLACE(column1, 'old_text', 'new_text') AS replaced_string
FROM your_table_name;

-- ---------------------------------------------------------------------
-- String Length
-- ---------------------------------------------------------------------
SELECT LENGTH(column1) AS string_length
FROM your_table_name;
 -- ---------------------------------------------------------------------
-- Case Conversion
-- ---------------------------------------------------------------------
 SELECT LOWER(column1) as lower_case, UPPER(column1) AS upper_case FROM your_table_name;
   -- ---------------------------------------------------------------------
-- Find position
-- ---------------------------------------------------------------------
 SELECT LOCATE('test', column1) FROM your_table_name; --Returns the 1-indexed position