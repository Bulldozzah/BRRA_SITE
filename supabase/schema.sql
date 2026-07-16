-- ============================================================
-- BRRA Regulatory Ease – Supabase Schema
-- Paste this entire script into the Supabase SQL Editor and run
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles (mirrors auth.users, one row per registered user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  role        public.user_role NOT NULL DEFAULT 'user',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  code        TEXT        UNIQUE,
  description TEXT,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  level       INTEGER,
  description TEXT,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Positions
CREATE TABLE IF NOT EXISTS public.positions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  department_id UUID        REFERENCES public.departments(id) ON DELETE SET NULL,
  description   TEXT,
  created_by    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Profiles
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  phone           TEXT,
  employee_number TEXT        UNIQUE,
  department_id   UUID        REFERENCES public.departments(id) ON DELETE SET NULL,
  position_id     UUID        REFERENCES public.positions(id) ON DELETE SET NULL,
  grade_id        UUID        REFERENCES public.grades(id) ON DELETE SET NULL,
  date_joined     DATE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-create profile row when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at       ON public.profiles;
DROP TRIGGER IF EXISTS departments_updated_at    ON public.departments;
DROP TRIGGER IF EXISTS grades_updated_at         ON public.grades;
DROP TRIGGER IF EXISTS positions_updated_at      ON public.positions;
DROP TRIGGER IF EXISTS staff_profiles_updated_at ON public.staff_profiles;

CREATE TRIGGER profiles_updated_at       BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER departments_updated_at    BEFORE UPDATE ON public.departments    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER grades_updated_at         BEFORE UPDATE ON public.grades         FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER positions_updated_at      BEFORE UPDATE ON public.positions      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before re-creating
DROP POLICY IF EXISTS "profiles_select_own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger"     ON public.profiles;

DROP POLICY IF EXISTS "departments_select"          ON public.departments;
DROP POLICY IF EXISTS "departments_manage_admin"    ON public.departments;

DROP POLICY IF EXISTS "grades_select"               ON public.grades;
DROP POLICY IF EXISTS "grades_manage_admin"         ON public.grades;

DROP POLICY IF EXISTS "positions_select"            ON public.positions;
DROP POLICY IF EXISTS "positions_manage_admin"      ON public.positions;

DROP POLICY IF EXISTS "staff_profiles_select"       ON public.staff_profiles;
DROP POLICY IF EXISTS "staff_profiles_update_own"   ON public.staff_profiles;
DROP POLICY IF EXISTS "staff_profiles_insert_own"   ON public.staff_profiles;
DROP POLICY IF EXISTS "staff_profiles_manage_admin" ON public.staff_profiles;

-- profiles policies
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE USING (public.is_admin());

CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT WITH CHECK (TRUE);

-- departments policies
CREATE POLICY "departments_select"
  ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "departments_manage_admin"
  ON public.departments FOR ALL USING (public.is_admin());

-- grades policies
CREATE POLICY "grades_select"
  ON public.grades FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "grades_manage_admin"
  ON public.grades FOR ALL USING (public.is_admin());

-- positions policies
CREATE POLICY "positions_select"
  ON public.positions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "positions_manage_admin"
  ON public.positions FOR ALL USING (public.is_admin());

-- staff_profiles policies
CREATE POLICY "staff_profiles_select"
  ON public.staff_profiles FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "staff_profiles_update_own"
  ON public.staff_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "staff_profiles_insert_own"
  ON public.staff_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_staff_or_admin());

CREATE POLICY "staff_profiles_manage_admin"
  ON public.staff_profiles FOR ALL USING (public.is_admin());

-- ============================================================
-- 6. NEWS TABLE
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.news_category AS ENUM ('general', 'newsletter', 'announcement', 'event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.news (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  summary       TEXT,
  content       TEXT        NOT NULL DEFAULT '',
  category      public.news_category NOT NULL DEFAULT 'general',
  is_published  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_featured   BOOLEAN     NOT NULL DEFAULT FALSE,
  image_url     TEXT,
  pdf_url       TEXT,
  pdf_file_size INTEGER,
  author_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name   TEXT,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS news_updated_at ON public.news;
CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_select_published" ON public.news;
DROP POLICY IF EXISTS "news_select_admin"     ON public.news;
DROP POLICY IF EXISTS "news_manage_admin"     ON public.news;

-- Anyone (including anon) can read published news
CREATE POLICY "news_select_published"
  ON public.news FOR SELECT USING (is_published = TRUE);

-- Admins can see all news (drafts too)
CREATE POLICY "news_select_admin"
  ON public.news FOR SELECT USING (public.is_admin());

-- Only admins can insert/update/delete
CREATE POLICY "news_manage_admin"
  ON public.news FOR ALL USING (public.is_admin());

-- ============================================================
-- 7. STORAGE BUCKETS (run in SQL Editor)
-- ============================================================

-- Create public buckets for news assets
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('news-pdfs', 'news-pdfs', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can view, only admins can upload/delete
DROP POLICY IF EXISTS "news_images_select" ON storage.objects;
DROP POLICY IF EXISTS "news_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "news_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "news_pdfs_select" ON storage.objects;
DROP POLICY IF EXISTS "news_pdfs_insert" ON storage.objects;
DROP POLICY IF EXISTS "news_pdfs_delete" ON storage.objects;

CREATE POLICY "news_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "news_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-images' AND public.is_admin());
CREATE POLICY "news_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'news-images' AND public.is_admin());

CREATE POLICY "news_pdfs_select" ON storage.objects FOR SELECT USING (bucket_id = 'news-pdfs');
CREATE POLICY "news_pdfs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-pdfs' AND public.is_admin());
CREATE POLICY "news_pdfs_delete" ON storage.objects FOR DELETE USING (bucket_id = 'news-pdfs' AND public.is_admin());

-- ============================================================
-- 8. DOCUMENTS / INFORMATION CENTRE
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.document_category AS ENUM (
    'strategic_plan',
    'annual_report',
    'policy_document',
    'guideline',
    'research_paper',
    'newsletter',
    'presentation',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  category      public.document_category NOT NULL DEFAULT 'other',
  file_url      TEXT        NOT NULL,
  file_name     TEXT        NOT NULL,
  file_size     INTEGER,
  file_type     TEXT,
  is_published  BOOLEAN     NOT NULL DEFAULT FALSE,
  uploaded_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_published" ON public.documents;
DROP POLICY IF EXISTS "documents_select_admin"     ON public.documents;
DROP POLICY IF EXISTS "documents_manage_admin"     ON public.documents;

CREATE POLICY "documents_select_published"
  ON public.documents FOR SELECT USING (is_published = TRUE);

CREATE POLICY "documents_select_admin"
  ON public.documents FOR SELECT USING (public.is_admin());

CREATE POLICY "documents_manage_admin"
  ON public.documents FOR ALL USING (public.is_admin());

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_bucket_delete" ON storage.objects;

CREATE POLICY "documents_bucket_select" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "documents_bucket_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND public.is_admin());
CREATE POLICY "documents_bucket_delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND public.is_admin());

-- ============================================================
-- 9. GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.news TO anon;
GRANT SELECT ON public.documents TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
