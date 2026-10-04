-- Migration: 0003_add_encrypted_activation_code.sql
-- Description: Add encrypted_activation_code column to cards table for secure admin key recovery

ALTER TABLE cards ADD COLUMN encrypted_activation_code TEXT;
