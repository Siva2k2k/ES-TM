import { StrictMode } from 'react';
// Ensure generator/polyfill runtime is available for some bundled libs (eg. react-speech-recognition)
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { AuthProvider } from './store/contexts/AuthContext';
import { ThemeProvider } from './contexts/theme';
import { VoiceProvider } from './contexts/VoiceContext';
import { SuspenseWrapper } from './components/common/SuspenseWrapper';
import { msalInstance } from './config/msalConfig';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SuspenseWrapper>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <VoiceProvider>
                <App />
              </VoiceProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </MsalProvider>
    </SuspenseWrapper>
  </StrictMode>
);
