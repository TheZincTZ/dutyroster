import { Suspense } from "react";
import ExtrasClient from "./ExtrasClient";

export const metadata = {
  title: "Extras Personnel"
};

export default function ExtrasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
        <div className="text-center text-green-700 text-lg font-medium flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🌀</span>
          Loading...
        </div>
      </div>
    }>
      <ExtrasClient />
    </Suspense>
  );
} 