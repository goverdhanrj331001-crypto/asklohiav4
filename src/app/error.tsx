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
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
      <h2 className="text-2xl font-bold mb-4 text-red-500">Oops, something went wrong!</h2>
      <p className="mb-6 text-gray-500 dark:text-gray-400">An unexpected error occurred while rendering this page.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
