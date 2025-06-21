-- ChatCraftAI Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE chatcraftai'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chatcraftai')\gexec

-- Connect to the chatcraftai database
\c chatcraftai;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a dedicated user for the application (optional)
-- CREATE USER chatcraftai_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE chatcraftai TO chatcraftai_user;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
SELECT 'ChatCraftAI database initialized successfully' as status;