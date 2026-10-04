import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

export interface TurnstileRef {
  reset: () => void;
}

export interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: (error?: unknown) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  testId?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (error?: unknown) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  (
    {
      siteKey,
      onSuccess,
      onError,
      onExpire,
      theme = 'light',
      className = '',
      testId = 'turnstile-widget',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Keep callbacks fresh in refs so effect does not re-render unnecessarily
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
      onSuccessRef.current = onSuccess;
      onErrorRef.current = onError;
      onExpireRef.current = onExpire;
    });

    // Expose imperative handle for widget reset
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (e) {
            console.warn('[Turnstile] Reset failed:', e);
          }
        }
      },
    }));

    useEffect(() => {
      let isMounted = true;

      const renderWidget = () => {
        if (!isMounted || !containerRef.current || !window.turnstile) return;

        // Clean up previous widget instance if one already existed
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore cleanup errors
          }
          widgetIdRef.current = null;
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              if (isMounted) {
                setIsLoading(false);
                setLoadError(false);
                onSuccessRef.current(token);
              }
            },
            'error-callback': (err: unknown) => {
              if (isMounted) {
                setIsLoading(false);
                setLoadError(true);
                onErrorRef.current?.(err);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                onExpireRef.current?.();
              }
            },
            theme,
            size: 'normal',
          });

          widgetIdRef.current = id;
          if (isMounted) {
            setIsLoading(false);
          }
        } catch (err) {
          console.error('[Turnstile] Render error:', err);
          if (isMounted) {
            setLoadError(true);
            setIsLoading(false);
            onErrorRef.current?.(err);
          }
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = SCRIPT_ID;
          script.src = SCRIPT_URL;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        const handleLoad = () => {
          if (isMounted) {
            renderWidget();
          }
        };

        const handleError = (e: Event) => {
          if (isMounted) {
            setLoadError(true);
            setIsLoading(false);
            onErrorRef.current?.(e);
          }
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        return () => {
          isMounted = false;
          script?.removeEventListener('load', handleLoad);
          script?.removeEventListener('error', handleError);
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {
              // ignore
            }
            widgetIdRef.current = null;
          }
        };
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, theme]);

    return (
      <div
        className={`flex flex-col items-center justify-center my-2 min-h-[65px] ${className}`}
        data-testid={testId}
        role="region"
        aria-label="Security challenge"
      >
        <div ref={containerRef} className="flex justify-center" />
        {isLoading && (
          <div className="text-xs text-zinc-500 py-2 flex items-center gap-1.5 animate-pulse">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-400"></span>
            Loading verification challenge...
          </div>
        )}
        {loadError && (
          <p className="text-xs text-red-600 mt-1 text-center font-medium">
            Verification challenge failed to load. Please check your network or ad-blocker.
          </p>
        )}
      </div>
    );
  }
);

Turnstile.displayName = 'Turnstile';
