import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (processed.current) return;
      processed.current = true;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log("Exchanging code for session...");
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        console.log("Checking for established session...");
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (data.session) {
          console.log("Session established. Redirecting to dashboard.");
          await checkAuth();
          navigate('/dashboard', { replace: true });
        } else {
          // If using implicit flow with #access_token, Supabase might need a moment to parse it
          // Wait briefly and try again
          setTimeout(async () => {
             const { data: retryData } = await supabase.auth.getSession();
             if (retryData.session) {
                console.log("Session established on retry. Redirecting.");
                await checkAuth();
                navigate('/dashboard', { replace: true });
             } else {
                console.error("No session could be established after callback.");
                setError("No session could be established. Please try logging in again.");
             }
          }, 1500);
        }
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError("Unable to complete Google sign-in. Please try again.");
      }
    };
    
    handleCallback();
  }, [navigate, checkAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-4">
        <div className="bg-card p-6 md:p-8 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border flex flex-col items-center max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2 text-foreground">Authentication Failed</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/login', { replace: true })} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-50" />
    </div>
  );
}
