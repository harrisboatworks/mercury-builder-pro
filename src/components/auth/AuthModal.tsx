import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from './AuthProvider';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { PasswordStrength, validatePasswordStrength } from '@/components/ui/password-strength';
import { authSchema } from '@/lib/validation';
import { useIsMobile } from '@/hooks/use-mobile';
import { GoogleSignInButton } from './GoogleSignInButton';
import { FacebookSignInButton } from './FacebookSignInButton';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const AuthModal = ({ 
  open, 
  onOpenChange, 
  mode: initialMode = 'signin',
  onSuccess,
  title,
  description 
}: AuthModalProps) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Enhanced validation for signup
      if (mode === 'signup') {
        const validation = authSchema.safeParse({
          email,
          password,
          displayName: displayName || undefined
        });

        if (!validation.success) {
          const errors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            errors[err.path[0] as string] = err.message;
          });
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        // Additional password strength check
        const { isValid } = validatePasswordStrength(password);
        if (!isValid) {
          setValidationErrors({ password: 'Password does not meet security requirements' });
          setLoading(false);
          return;
        }
      }

      let result;
      if (mode === 'signup') {
        result = await signUp(email, password, displayName);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setEmail('');
        setPassword('');
        setDisplayName('');
        setValidationErrors({});
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setValidationErrors({});
  };

  const headerTitle = title || (mode === 'signin' ? 'Sign In' : 'Create Account');
  const headerDescription = description || (mode === 'signin' 
    ? 'Sign in to your account to save and manage your quotes.' 
    : 'Create an account to save your quotes and access them anytime.'
  );

  // Shared form content
  const formContent = (
    <div className="space-y-4">
      {/* Social Sign-In Buttons */}
      <GoogleSignInButton 
        onError={(err) => setError(err.message)}
      />
      <FacebookSignInButton 
        onError={(err) => setError(err.message)}
      />
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="displayName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="displayName"
              type="text"
              placeholder="Enter your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          {validationErrors.displayName && (
            <p className="text-sm text-destructive">{validationErrors.displayName}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
            minLength={mode === 'signup' ? 12 : 6}
          />
        </div>
        {validationErrors.password && (
          <p className="text-sm text-destructive">{validationErrors.password}</p>
        )}
        {mode === 'signup' && (
          <PasswordStrength password={password} />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
          </>
        ) : (
          mode === 'signin' ? 'Sign In' : 'Create Account'
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={toggleMode}
          className="text-sm"
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Sign in'
          }
        </Button>
      </div>
      </form>
    </div>
  );

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle>{headerTitle}</DrawerTitle>
            <DrawerDescription>{headerDescription}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{headerTitle}</DialogTitle>
          <DialogDescription>{headerDescription}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
