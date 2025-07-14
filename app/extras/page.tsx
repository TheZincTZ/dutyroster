import { Suspense } from 'react';
import ExtrasClient from './ExtrasClient';
import AuthWrapper from '../lib/auth';

export const metadata = {
  title: "Extras Personnel"
};

export default function ExtrasPage() {
  return (
    <AuthWrapper>
      <Suspense fallback={<div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div><p className="text-green-700">Loading duty roster...</p></div>}>
        <ExtrasClient />
      </Suspense>
    </AuthWrapper>
  );
} 