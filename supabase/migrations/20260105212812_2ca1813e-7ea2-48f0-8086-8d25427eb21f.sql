UPDATE google_sheets_config 
SET 
  sheet_url = 'https://docs.google.com/spreadsheets/d/1gD40fB5nzufxWuZE5utDoe_ePWsjWx8bctef-oRIgns/edit?usp=sharing',
  sync_frequency = 'weekly',
  auto_sync_enabled = true,
  updated_at = now()
WHERE id = '5b59e41e-60b4-4c5f-8701-4eb43d7601fe';