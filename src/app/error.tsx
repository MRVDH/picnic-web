"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold text-foreground">
        Er is iets misgegaan
      </h2>
      <p className="mt-2 text-gray-500">
        {error.message || "Een onverwachte fout is opgetreden."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-picnic-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-picnic-red-dark"
      >
        Probeer opnieuw
      </button>
    </div>
  );
}
