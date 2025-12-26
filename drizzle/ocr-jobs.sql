-- OCR Jobs tabel voor idempotency en status tracking
CREATE TABLE IF NOT EXISTS ocr_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_path text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'done', 'failed')) DEFAULT 'started',
  error_code text,
  error_message text,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_user_created 
  ON ocr_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status 
  ON ocr_jobs(status);

-- Unique constraint: één actieve job per user/path combinatie (optioneel, kan ook meerdere toestaan)
-- We maken dit niet unique omdat users meerdere imports van dezelfde foto mogen proberen
-- Maar we kunnen wel checken op recente jobs met dezelfde path

-- RLS policies voor ocr_jobs
ALTER TABLE ocr_jobs ENABLE ROW LEVEL SECURITY;

-- Users kunnen alleen eigen jobs zien
CREATE POLICY "Users can view own ocr jobs"
  ON ocr_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users kunnen eigen jobs aanmaken
CREATE POLICY "Users can create own ocr jobs"
  ON ocr_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users kunnen eigen jobs updaten (voor retry bij failed)
CREATE POLICY "Users can update own ocr jobs"
  ON ocr_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role kan alles (voor admin client)
CREATE POLICY "Service role can manage ocr jobs"
  ON ocr_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

