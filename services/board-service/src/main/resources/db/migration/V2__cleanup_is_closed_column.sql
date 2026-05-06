-- Cleanup redundant column if it exists from previous Hibernate auto-updates
SET @dbname = DATABASE();
SET @tablename = 'boards';
SET @columnname = 'is_closed';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'ALTER TABLE boards DROP COLUMN is_closed',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
