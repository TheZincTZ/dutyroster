import { Suspense } from 'react';
import HomeClient from '@/app/HomeClient';

export const metadata = {
  title: "Homepage"
};

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
      <Suspense fallback={<div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div><p className="text-green-700">Loading duty roster...</p></div>}>
        <HomeClient />
      </Suspense>
      </main>
  );
}
