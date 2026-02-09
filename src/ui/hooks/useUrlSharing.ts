import { useState, useCallback, useRef } from 'react';
import { encodeForUrl } from '../../diagram/infrastructure/urlCodec';

export type ShareStatus = 'idle' | 'copied' | 'error';

export function useUrlSharing() {
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const share = useCallback(async (archJson: string, ucJson: string) => {
    try {
      const payload = JSON.stringify({ arch: archJson, uc: ucJson });
      const encoded = await encodeForUrl(payload);
      const url = `${window.location.origin}${window.location.pathname}#${encoded}`;

      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, '', `#${encoded}`);

      setShareStatus('copied');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      setShareStatus('error');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus('idle'), 2000);
    }
  }, []);

  return { share, shareStatus };
}
