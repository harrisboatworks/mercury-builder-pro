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
import { MicOff, RefreshCw, Headphones } from 'lucide-react';

interface NoMicrophoneDialogProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
}

const isMac = () => navigator.platform?.toLowerCase().includes('mac');

export const NoMicrophoneDialog: React.FC<NoMicrophoneDialogProps> = ({
  open,
  onClose,
  onRetry,
}) => {
  const macInstructions = (
    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
      <li>Open <strong>System Settings</strong> (or System Preferences)</li>
      <li>Go to <strong>Sound</strong> → <strong>Input</strong></li>
      <li>Check if a microphone is listed and selected</li>
      <li>If using external mic, ensure it's properly connected</li>
      <li>Try built-in microphone if available</li>
    </ol>
  );

  const genericInstructions = (
    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
      <li>Check if a microphone is connected to your device</li>
      <li>Open your system's <strong>Sound Settings</strong></li>
      <li>Verify an input device is selected</li>
      <li>Try using a headset with a built-in microphone</li>
      <li>Restart your browser after connecting a microphone</li>
    </ol>
  );

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <MicOff className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">No Microphone Found</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            We couldn't detect any microphone connected to your device. Voice chat requires a working microphone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4 rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            Troubleshooting steps:
          </p>
          {isMac() ? macInstructions : genericInstructions}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Again
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
