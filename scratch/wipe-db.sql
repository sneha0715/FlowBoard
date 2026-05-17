-- Drop all databases
DROP DATABASE IF EXISTS auth_db;
DROP DATABASE IF EXISTS workspace_db;
DROP DATABASE IF EXISTS board_db;
DROP DATABASE IF EXISTS column_db;
DROP DATABASE IF EXISTS card_db;
DROP DATABASE IF EXISTS comment_db;
DROP DATABASE IF EXISTS checklist_db;
DROP DATABASE IF EXISTS notification_db;

-- Recreate them
CREATE DATABASE auth_db        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE workspace_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE board_db       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE column_db      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE card_db        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE comment_db     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE checklist_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
