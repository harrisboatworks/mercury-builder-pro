-- Ensure motor_models table has all required columns for brochure seeding
DO $$ 
BEGIN
  -- Add accessory_notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'motor_models' AND column_name = 'accessory_notes') THEN
    ALTER TABLE motor_models ADD COLUMN accessory_notes JSONB NOT NULL DEFAULT '[]';
  END IF;
  
  -- Add catalog_snapshot_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'motor_models' AND column_name = 'catalog_snapshot_url') THEN
    ALTER TABLE motor_models ADD COLUMN catalog_snapshot_url TEXT;
  END IF;
  
  -- Ensure model_key is indexed for performance
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'motor_models' AND indexname = 'idx_motor_models_model_key') THEN
    CREATE INDEX idx_motor_models_model_key ON motor_models(model_key);
  END IF;
  
  -- Ensure composite index for brochure deduplication
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'motor_models' AND indexname = 'idx_motor_models_brochure_dedupe') THEN
    CREATE INDEX idx_motor_models_brochure_dedupe ON motor_models(model_key, mercury_model_no) WHERE is_brochure = true;
  END IF;
END $$;