-- Grant admin role to harrisboatworks@hotmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('4f7fadc1-0003-42a2-8285-8df5fd3862c1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;