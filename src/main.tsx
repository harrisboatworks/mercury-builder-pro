import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { HelmetProvider } from '@/lib/helmet'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

console.log('🚀 Main.tsx executing...');

// One-time cleanup: unregister any previously installed service workers and
// purge their caches. The PWA was disabled because it served stale app shell
// HTML/JS to returning visitors, masking SEO and canonical fixes. This block
// lets existing visitors recover automatically on their next visit without
// having to manually clear browser data.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((r) => {
        r.unregister().catch(() => {});
      });
    })
    .catch(() => {});

  if (typeof caches !== 'undefined' && caches?.keys) {
    caches
      .keys()
      .then((names) => {
        names.forEach((n) => {
          caches.delete(n).catch(() => {});
        });
      })
      .catch(() => {});
  }
}

// Helper to create error fallback using safe DOM methods (no innerHTML)
function createErrorFallback(isRootMissing: boolean, errorDetails?: string) {
  const container = document.createElement('div');
  container.style.cssText = 'text-align: center; padding: 2rem; font-family: system-ui; max-width: 600px; margin: 0 auto;';

  const heading = document.createElement('h2');
  heading.textContent = isRootMissing ? 'Loading Error' : 'Application Error';
  heading.style.cssText = isRootMissing ? '' : 'color: #dc2626;';
  container.appendChild(heading);

  const message = document.createElement('p');
  message.textContent = isRootMissing 
    ? 'Unable to find root element.' 
    : 'The application failed to load properly.';
  message.style.cssText = 'margin: 1rem 0;';
  container.appendChild(message);

  const linkContainer = document.createElement('div');
  linkContainer.style.cssText = 'margin: 1.5rem 0;';
  const link = document.createElement('a');
  link.href = '/quote/motor-selection';
  link.textContent = isRootMissing ? 'Click here to continue' : 'Continue to Quote Builder';
  link.style.cssText = isRootMissing 
    ? '' 
    : 'background: #2563eb; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 0.375rem; display: inline-block;';
  linkContainer.appendChild(link);
  container.appendChild(linkContainer);

  if (errorDetails) {
    const details = document.createElement('details');
    details.style.cssText = 'margin-top: 2rem; text-align: left;';
    const summary = document.createElement('summary');
    summary.textContent = 'Technical Details';
    summary.style.cssText = 'cursor: pointer;';
    details.appendChild(summary);
    const pre = document.createElement('pre');
    pre.textContent = errorDetails;
    pre.style.cssText = 'background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; margin-top: 0.5rem;';
    details.appendChild(pre);
    container.appendChild(details);
  }

  document.body.appendChild(container);
}

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('❌ Root element not found!');
    createErrorFallback(true);
    throw new Error('Root element not found');
  }

  console.log('✅ Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  console.log('✅ React root created, rendering App...');
  root.render(
    <HelmetProvider context={{}}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
  
  console.log('✅ App rendered successfully!');
  
} catch (error) {
  console.error('❌ Fatal error in main.tsx:', error);
  createErrorFallback(false, String(error));
}
