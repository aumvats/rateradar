import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="font-data font-bold text-2xl text-accent">404</span>
      </div>
      <h1 className="font-heading font-bold text-xl text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 active:scale-[0.97] transition-all duration-150"
      >
        Go home
      </Link>
    </div>
  );
}
