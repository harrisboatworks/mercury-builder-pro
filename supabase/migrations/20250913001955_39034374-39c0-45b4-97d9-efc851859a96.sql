-- First, let's create an admin user for the current authenticated user
-- This will assign admin role to whoever runs this migration

INSERT INTO user_roles (user_id, role)
SELECT auth.uid(), 'admin'::app_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role, updated_at = now();

-- Also create a function to easily make users admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find the user by email from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (target_user_id, 'admin'::app_role)
        ON CONFLICT (user_id) DO UPDATE SET 
            role = 'admin'::app_role,
            updated_at = now();
    ELSE
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;