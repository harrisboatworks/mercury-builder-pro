import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

console.log('🚀 Main.tsx executing...');

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = `
      <div style="text-align: center; padding: 2rem; font-family: system-ui;">
        <h2>Loading Error</h2>
        <p>Unable to find root element. <a href="/quote/motor-selection">Click here to continue</a></p>
      </div>
    `;
    throw new Error('Root element not found');
  }

  console.log('✅ Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  console.log('✅ React root created, rendering App...');
  root.render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  );
  
  console.log('✅ App rendered successfully!');
  
} catch (error) {
  console.error('❌ Fatal error in main.tsx:', error);
  
  // Ultimate fallback
  document.body.innerHTML = `
    <div style="text-align: center; padding: 2rem; font-family: system-ui; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Application Error</h2>
      <p style="margin: 1rem 0;">The application failed to load properly.</p>
      <div style="margin: 1.5rem 0;">
        <a href="/quote/motor-selection" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 0.375rem; display: inline-block;">
          Continue to Quote Builder
        </a>
      </div>
      <details style="margin-top: 2rem; text-align: left;">
        <summary style="cursor: pointer;">Technical Details</summary>
        <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; margin-top: 0.5rem;">${error}</pre>
      </details>
    </div>
  `;
}
