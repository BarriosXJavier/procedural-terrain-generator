"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      Initializing WebGL...
    </div>
  ),
});

export default function Page() {
  const [terrainType, setTerrainType] = useState<'water' | 'mountain'>('water');

  return (
    <main className="h-screen w-full relative overflow-hidden bg-black">
      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter text-white uppercase">
          Procedural <br /> Horizon{" "}
        </h1>
        <p className="text-zinc-500 mt-2">GPU-Accelerated terrain generator</p>
      </div>

      {/* Terrain Switcher */}
      <div className="absolute top-10 right-10 z-10 flex gap-3 pointer-events-auto">
        <button
          onClick={() => setTerrainType('water')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            terrainType === 'water'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Water
        </button>
        <button
          onClick={() => setTerrainType('mountain')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            terrainType === 'mountain'
              ? 'bg-stone-600 text-white shadow-lg'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Mountain
        </button>
      </div>

      <Scene terrainType={terrainType} />
    </main>
  );
}
