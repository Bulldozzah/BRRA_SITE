-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  is_subscribed boolean DEFAULT true NOT NULL,
  subscribed_at timestamptz DEFAULT now() NOT NULL,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(email)
);

-- RLS policies
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "anyone_can_subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "users_view_own_subscription" ON public.newsletter_subscribers
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Users can update their own subscription (unsubscribe/resubscribe)
CREATE POLICY "users_update_own_subscription" ON public.newsletter_subscribers
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all subscribers
CREATE POLICY "admin_view_all_subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );
