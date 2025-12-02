import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-text mb-4">404</h2>
        <p className="text-textSecondary mb-6">Page not found</p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

