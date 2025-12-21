import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BlogUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid unsubscribe link - no token provided');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('unsubscribe-blog', {
          body: { token }
        });

        if (error) throw error;

        if (data?.success) {
          setStatus('success');
          setMessage(data.message || 'Successfully unsubscribed from blog updates');
        } else {
          throw new Error(data?.error || 'Failed to unsubscribe');
        }
      } catch (err: any) {
        console.error('Blog unsubscribe error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to unsubscribe. The link may be invalid or expired.');
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Processing your request...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              You won't receive any more blog update emails from us.
            </p>
            <div className="flex gap-3 mt-6">
              <Button asChild>
                <Link to="/blog">Visit Blog</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Return Home</Link>
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Something Went Wrong</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" asChild>
                <Link to="/">Return Home</Link>
              </Button>
              <Button asChild>
                <a href="mailto:info@harrisboatworks.ca">Contact Support</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogUnsubscribe;
