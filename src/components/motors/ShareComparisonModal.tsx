import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Link2, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ShareComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  motorCount: number;
}

export function ShareComparisonModal({ 
  isOpen, 
  onClose, 
  shareUrl, 
  motorCount 
}: ShareComparisonModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this motor comparison`);
    const body = encodeURIComponent(`I'm comparing ${motorCount} motors and wanted to share with you:\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSMSShare = () => {
    const body = encodeURIComponent(`Check out this motor comparison: ${shareUrl}`);
    window.open(`sms:?body=${body}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Link2 className="text-primary" size={20} />
                  <h3 className="font-semibold text-lg">Share Comparison</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Share this link with anyone to show them your {motorCount}-motor comparison.
                </p>
                
                {/* Copy Link */}
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="flex-1 text-sm bg-muted/50"
                  />
                  <Button onClick={handleCopy} variant="default" className="shrink-0">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
                
                {/* Share Options */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Or share via:</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleEmailShare}
                      className="flex-1 gap-2"
                    >
                      <Mail size={16} />
                      Email
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSMSShare}
                      className="flex-1 gap-2"
                    >
                      <MessageSquare size={16} />
                      Text
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-muted/30 border-t border-border">
                <Button onClick={onClose} variant="ghost" className="w-full">
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}