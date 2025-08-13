// Enhanced authentication component with security features
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { validatePasswordStrength, SecurityManager } from '@/lib/securityMiddleware';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'Display name is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const SecureAuth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{isValid: boolean; errors: string[]}>({
    isValid: false,
    errors: []
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  // Validate password strength in real-time
  useEffect(() => {
    if (isSignUp && formData.password) {
      setPasswordStrength(validatePasswordStrength(formData.password));
    }
  }, [formData.password, isSignUp]);

  // Rate limiting check
  const checkRateLimit = async () => {
    if (formData.email) {
      const canProceed = await SecurityManager.checkRateLimit(formData.email, 'auth_attempt');
      setIsRateLimited(!canProceed);
      return canProceed;
    }
    return true;
  };

  const validateForm = () => {
    const schema = isSignUp ? signUpSchema : signInSchema;
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    // Additional password strength check for sign up
    if (isSignUp && !passwordStrength.isValid) {
      setErrors({ password: 'Password does not meet security requirements' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Check rate limiting
    const canProceed = await checkRateLimit();
    if (!canProceed) {
      toast({
        title: "Too Many Attempts",
        description: "Please wait before trying again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, formData.displayName);
      } else {
        result = await signIn(formData.email, formData.password);
      }

      if (result.error) {
        setFailedAttempts(prev => prev + 1);
        
        // Log failed attempt
        await SecurityManager.logSecurityEvent(
          formData.email,
          isSignUp ? 'signup_failed' : 'signin_failed',
          'auth',
          undefined,
          { 
            ipAddress: undefined,
            userAgent: navigator.userAgent,
            reason: result.error.message
          }
        );

        // Handle specific error types
        if (result.error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password' });
        } else if (result.error.message.includes('User already registered')) {
          setErrors({ email: 'An account with this email already exists' });
        } else {
          setErrors({ general: result.error.message });
        }
        
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        // Log successful attempt
        await SecurityManager.logSecurityEvent(
          formData.email,
          isSignUp ? 'signup_success' : 'signin_success',
          'auth',
          undefined,
          { 
            ipAddress: undefined,
            userAgent: navigator.userAgent
          }
        );

        if (isSignUp) {
          toast({
            title: "Account Created",
            description: "Please check your email to verify your account.",
          });
        } else {
          toast({
            title: "Welcome Back",
            description: "You have been signed in successfully.",
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Sign up for a secure account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Input
                  name="displayName"
                  type="text"
                  placeholder="Display Name"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive mt-1">{errors.displayName}</p>
                )}
              </div>
            )}

            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            {isSignUp && (
              <>
                <div>
                  <Input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {formData.password && (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Password Requirements:</p>
                    {passwordStrength.errors.map((error, index) => (
                      <p key={index} className="text-muted-foreground">• {error}</p>
                    ))}
                    {passwordStrength.isValid && (
                      <p className="text-green-600">✓ Password meets all requirements</p>
                    )}
                  </div>
                )}
              </>
            )}

            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {isRateLimited && (
              <Alert variant="destructive">
                <AlertDescription>
                  Too many failed attempts. Please wait before trying again.
                </AlertDescription>
              </Alert>
            )}

            {failedAttempts >= 3 && (
              <Alert>
                <AlertDescription>
                  Multiple failed attempts detected. If you're having trouble, please check your credentials.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isRateLimited}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
                  setErrors({});
                  setFailedAttempts(0);
                }}
                className="text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};