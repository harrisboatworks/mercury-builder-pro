-- Grant admin role to the user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('17b25389-2f3f-4997-9c2d-2bcde9e6b7bc', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;