import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface FacebookSignInButtonProps {
  redirectTo?: string;
  variant?: 'default' | 'outline';
  className?: string;
  onError?: (error: Error) => void;
}

export const FacebookSignInButton = ({ 
  redirectTo, 
  variant = 'outline',
  className = '',
  onError 
}: FacebookSignInButtonProps) => {
  const { signInWithFacebook } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithFacebook(redirectTo);
      if (error) {
        onError?.(error);
      }
    } catch (err: any) {
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleFacebookSignIn}
      disabled={loading}
      className={`w-full gap-3 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#1877F2"
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      )}
      Continue with Facebook
    </Button>
  );
};
