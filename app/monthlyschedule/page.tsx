import { Suspense } from 'react';
import MonthlyscheduleClient from './MonthlyscheduleClient';
import AuthWrapper from '../lib/auth';

export const metadata = {
  title: "Monthly Schedule"
};

export default function MonthlyschedulePage() {
  return (
    <AuthWrapper>
      <Suspense fallback={<div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div><p className="text-green-700">Loading duty roster...</p></div>}>
        <MonthlyscheduleClient />
      </Suspense>
    </AuthWrapper>
  );
}