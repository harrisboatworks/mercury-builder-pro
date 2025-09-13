-- First, add a unique constraint to prevent duplicate user roles
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Then assign admin role to any existing authenticated user
-- This will work when you're logged in and run this
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (current_user_id, 'admin'::app_role)
        ON CONFLICT (user_id) DO UPDATE SET 
            role = 'admin'::app_role,
            updated_at = now();
    END IF;
END
$$;