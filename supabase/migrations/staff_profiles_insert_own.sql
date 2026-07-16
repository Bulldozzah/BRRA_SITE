-- Allow staff members to create their own staff profile.
-- Previously only admins could insert into staff_profiles, so after an admin
-- assigned the 'staff' role, the admin also had to create the profile row.
-- With this policy, a user with staff (or admin) role can create the profile
-- linked to their own account; they could already update it.

DROP POLICY IF EXISTS "staff_profiles_insert_own" ON public.staff_profiles;

CREATE POLICY "staff_profiles_insert_own"
  ON public.staff_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_staff_or_admin());
