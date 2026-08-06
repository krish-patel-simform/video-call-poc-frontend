export function HeroBanner() {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        Next-Gen Realtime Collaboration
      </div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
        Video calls and meetings for{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
          everyone.
        </span>
      </h1>
      <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
        Connect, collaborate, and celebrate from anywhere with crystal-clear HD
        video calls, real-time screen sharing, and secure WebRTC signaling.
      </p>
    </div>
  );
}
