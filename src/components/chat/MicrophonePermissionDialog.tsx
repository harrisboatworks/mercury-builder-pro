import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Mic, Settings, AlertCircle } from 'lucide-react';

interface MicrophonePermissionDialogProps {
  open: boolean;
  onClose: () => void;
  permissionState: 'denied' | 'prompt';
  onRetry: () => void;
}

const getBrowserName = (): 'chrome' | 'safari' | 'firefox' | 'edge' | 'other' => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'edge';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
  if (ua.includes('Firefox')) return 'firefox';
  return 'other';
};

const isMac = () => navigator.platform?.toLowerCase().includes('mac');

const getMacSystemInstructions = () => (
  <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
      Also check macOS System Settings:
    </p>
    <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
      <li>Open <strong>System Settings</strong> → <strong>Privacy & Security</strong></li>
      <li>Click <strong>Microphone</strong> in the sidebar</li>
      <li>Enable microphone access for your browser</li>
    </ol>
  </div>
);

const getBrowserInstructions = (browser: ReturnType<typeof getBrowserName>) => {
  const showMacInstructions = isMac();
  
  switch (browser) {
    case 'chrome':
      return (
        <div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click the <strong>lock icon</strong> (or tune icon) in the address bar</li>
            <li>Find <strong>"Microphone"</strong> in the permissions list</li>
            <li>Change it from "Block" to <strong>"Allow"</strong></li>
            <li>Refresh the page and try again</li>
          </ol>
          {showMacInstructions && getMacSystemInstructions()}
        </div>
      );
    case 'safari':
      return (
        <div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Open <strong>Safari → Settings</strong> (or Preferences)</li>
            <li>Click <strong>"Websites"</strong> tab</li>
            <li>Select <strong>"Microphone"</strong> from the left sidebar</li>
            <li>Find this site and change to <strong>"Allow"</strong></li>
            <li>Refresh the page and try again</li>
          </ol>
          {showMacInstructions && getMacSystemInstructions()}
        </div>
      );
    case 'firefox':
      return (
        <div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click the <strong>lock icon</strong> in the address bar</li>
            <li>Click <strong>"Connection Secure"</strong> → More Information</li>
            <li>Go to <strong>"Permissions"</strong> tab</li>
            <li>Find "Use the Microphone" and uncheck "Use Default"</li>
            <li>Select <strong>"Allow"</strong> and refresh the page</li>
          </ol>
          {showMacInstructions && getMacSystemInstructions()}
        </div>
      );
    case 'edge':
      return (
        <div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click the <strong>lock icon</strong> in the address bar</li>
            <li>Click <strong>"Permissions for this site"</strong></li>
            <li>Find <strong>"Microphone"</strong> and set to <strong>"Allow"</strong></li>
            <li>Refresh the page and try again</li>
          </ol>
          {showMacInstructions && getMacSystemInstructions()}
        </div>
      );
    default:
      return (
        <div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Open your browser's <strong>Settings</strong></li>
            <li>Navigate to <strong>Privacy & Security</strong> → Site Settings</li>
            <li>Find <strong>"Microphone"</strong> permissions</li>
            <li>Allow this site to use your microphone</li>
            <li>Refresh the page and try again</li>
          </ol>
          {showMacInstructions && getMacSystemInstructions()}
        </div>
      );
  }
};

export const MicrophonePermissionDialog: React.FC<MicrophonePermissionDialogProps> = ({
  open,
  onClose,
  permissionState,
  onRetry,
}) => {
  const browser = getBrowserName();
  const browserName = browser.charAt(0).toUpperCase() + browser.slice(1);

  if (permissionState === 'prompt') {
    return (
      <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <AlertDialogContent className="max-w-md w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">Enable Voice Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              To chat with Harris using your voice, we'll need access to your microphone. 
              Your audio is used only for the conversation and isn't stored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={onRetry} className="w-full">
              <Mic className="mr-2 h-4 w-4" />
              Allow Microphone Access
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Not Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Permission is denied - show browser-specific instructions
  return (
      <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <AlertDialogContent className="max-w-md w-[calc(100vw-2rem)]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">Microphone Access Blocked</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your browser is blocking microphone access. To enable voice chat in {browserName}:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4 rounded-lg bg-muted/50 p-4">
          {getBrowserInstructions(browser)}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onRetry} className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            I've Updated Settings - Try Again
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
