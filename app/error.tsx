'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text mb-4">Something went wrong!</h2>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

