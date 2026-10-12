import Link from 'next/link';
import { simpleCopy } from '@/content/ui';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-street text-4xl font-semibold">{simpleCopy.home.heading}</h1>
      <p className="text-snow max-w-md">{simpleCopy.home.intro}</p>
      <Link href="/simple" prefetch={false} className="text-hud underline underline-offset-4">
        {simpleCopy.home.simpleLink}
      </Link>
    </main>
  );
}
