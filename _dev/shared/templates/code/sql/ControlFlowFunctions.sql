-- ---------------------------------------------------------------------
 -- IF statement
 -- ---------------------------------------------------------------------
 DELIMITER //
 CREATE PROCEDURE my_procedure(IN input_value INT)
 BEGIN
     IF input_value > 10 THEN
         SELECT 'Input is greater than 10';
     ELSEIF input_value > 5 THEN
         SELECT 'Input is greater than 5 but not greater than 10';
     ELSE
         SELECT 'Input is 5 or less';
     END IF;
 END //
 DELIMITER ;

 -- ---------------------------------------------------------------------
 -- CASE statement
 -- ---------------------------------------------------------------------
 DELIMITER //
 CREATE PROCEDURE my_case_procedure(IN input_value INT)
     BEGIN
         CASE input_value
             WHEN 1 THEN
                 SELECT 'Input is one';
             WHEN 2 THEN
                 SELECT 'Input is two';
             ELSE
                 SELECT 'Input is something else';
         END CASE;
     END //
 DELIMITER ;

 -- ---------------------------------------------------------------------
 -- Loops (WHILE, REPEAT, LOOP)
 -- ---------------------------------------------------------------------
 -- WHILE loop
     DELIMITER //
 CREATE PROCEDURE my_while_loop()
     BEGIN
         DECLARE i INT DEFAULT 0;
         WHILE i < 5 DO
             SELECT i;
             SET i = i + 1;
         END WHILE;
     END//
 DELIMITER ;

 --REPEAT loop
     DELIMITER //
     CREATE PROCEDURE my_repeat_loop()
     BEGIN
       DECLARE i INT DEFAULT 0;
         REPEAT
             SELECT i;
             SET i = i + 1;
         UNTIL i >= 5
         END REPEAT;
     END //
     DELIMITER ;

 --LOOP (with LEAVE)
 DELIMITER //
     CREATE PROCEDURE my_loop()
     BEGIN
       DECLARE i INT DEFAULT 0;
         my_loop: LOOP
             SELECT i;
             SET i = i+1;
             IF i >= 5 THEN
               LEAVE my_loop;
             END IF;
         END LOOP my_loop;
     END //
 DELIMITER ;
 -- ---------------------------------------------------------------------
 -- Cursors (for row-by-row processing - advanced)
 -- ---------------------------------------------------------------------
   DELIMITER //

 CREATE PROCEDURE process_data()
 BEGIN
     DECLARE done INT DEFAULT FALSE;
     DECLARE cur_value VARCHAR(255);

     -- Declare the cursor
     DECLARE my_cursor CURSOR FOR SELECT column1 FROM your_table_name;

     -- Declare continue handler
     DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

     -- Open the cursor
     OPEN my_cursor;

     -- Loop through the results
     read_loop: LOOP
         -- Fetch the next row
         FETCH my_cursor INTO cur_value;

         -- Exit loop if no more rows
         IF done THEN
             LEAVE read_loop;
         END IF;

         -- Process the current row (example)
         SELECT CONCAT('Processing: ', cur_value);

     END LOOP;

     -- Close the cursor
     CLOSE my_cursor;
 END //

 DELIMITER ;