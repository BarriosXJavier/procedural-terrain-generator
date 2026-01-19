"use client";
import dynamic from "next/dynamic";

// disable ssr for the canvas
const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      Initializing WebGL...
    </div>
  ),
});

export default function Page() {
  return (
    <main className="h-screen w-full relative overflow-hidden bg-black">
      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter text-white uppercase">
          Procedural <br /> Horizon{" "}
        </h1>
        <p className="text-zinc-500 mt-2">GPU-Accelerated terrain generator</p>
      </div>
      <Scene />
    </main>
  );
}
