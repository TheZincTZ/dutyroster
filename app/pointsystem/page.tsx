import { Suspense } from "react";
import PointsystemClient from "./PointsystemClient";

export const metadata = {
  title: "Point System"
};

export default function PointSystemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
        <div className="text-center text-green-700 text-lg font-medium flex flex-col items-center gap-2">
          <span className="text-3xl animate-spin">🌀</span>
          Loading...
        </div>
      </div>
    }>
      <PointsystemClient />
    </Suspense>
  );
} 