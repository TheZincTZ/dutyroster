"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticated = sessionStorage.getItem('dutyRosterAuthenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-green-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-green-900 tracking-tight mb-2">
              Access Denied
            </h1>
            <p className="text-green-700">You need to authenticate first</p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors block text-center"
            >
              Go to Login Page
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Contact administrator for PIN access
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 