import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { GoogleSignInButton } from './GoogleSignInButton';
import { FacebookSignInButton } from './FacebookSignInButton';
import { BookmarkPlus, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SaveQuotePromptProps {
  referenceNumber: string;
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  quoteId?: string;
}

export const SaveQuotePrompt = ({ referenceNumber, contactInfo, quoteId }: SaveQuotePromptProps) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is already logged in or dismissed
  if (user || dismissed) {
    return null;
  }

  const redirectUrl = `${window.location.origin}/quote/success?ref=${referenceNumber}&oauth=google`;

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 rounded-full p-3">
              <BookmarkPlus className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Save Your Quote & Info
            </h3>
            <p className="text-muted-foreground mt-2">
              Create an account to access your quotes anytime
            </p>
          </div>

          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Access your quotes from any device</li>
            <li>• Speed up future quote requests</li>
            <li>• Get personalized follow-ups</li>
          </ul>

          {authError && (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 pt-2">
            <GoogleSignInButton 
              redirectTo={redirectUrl}
              onError={(err) => setAuthError(err.message)}
            />
            <FacebookSignInButton 
              redirectTo={redirectUrl}
              onError={(err) => setAuthError(err.message)}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowAuthModal(true)}
            >
              Create account with email
            </Button>

            <Button 
              variant="link" 
              className="text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </Card>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        mode="signup"
        title="Create Your Account"
        description="Save your quote and speed up future requests"
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </>
  );
};
