import Link from 'next/link';
import { simpleCopy } from '@/content/ui';

const copy = simpleCopy.notFound;

/** The 404 page, in theme: a wrong turn on the patrol, with a way back to the drive and the simple view. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-hud font-mono text-sm">404</p>
      <h1 className="text-street text-4xl font-semibold">{copy.heading}</h1>
      <p className="text-snow max-w-md">{copy.body}</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="border-street bg-street text-night rounded-md border px-5 py-3 font-semibold"
        >
          {copy.backToDrive}
        </Link>
        <Link
          href="/simple"
          prefetch={false}
          className="text-hud px-2 py-3 underline underline-offset-4"
        >
          {copy.simple}
        </Link>
      </div>
    </main>
  );
}
