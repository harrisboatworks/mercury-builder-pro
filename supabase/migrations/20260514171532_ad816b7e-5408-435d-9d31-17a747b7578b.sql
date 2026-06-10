-- Allow anonymous submitters to create a financing application row.
-- with_check restricts anon to inserting rows that are NOT tied to a real auth user,
-- preventing impersonation of authenticated accounts.
CREATE POLICY "Anon can create anonymous applications"
ON public.financing_applications
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Grant EXECUTE on the SIN encryption RPC to anonymous role.
-- The function is SECURITY DEFINER and only encrypts; decrypt_sin remains admin only.
GRANT EXECUTE ON FUNCTION public.encrypt_sin(text) TO anon;