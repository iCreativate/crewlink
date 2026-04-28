"use client";

export function MobileNav({ userId }: { userId: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-zinc-950/72 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-[520px] items-center justify-around px-4 py-3 text-xs font-semibold text-zinc-200">
        <a href="/feed" className="rounded-full px-3 py-2 transition hover:bg-white/10 active:scale-[0.99]">
          Feed
        </a>
        <a href="/jobs" className="rounded-full px-3 py-2 transition hover:bg-white/10 active:scale-[0.99]">
          Jobs
        </a>
        <a href="/dashboard/notifications" className="rounded-full px-3 py-2 transition hover:bg-white/10 active:scale-[0.99]">
          Alerts
        </a>
        <a href="/portfolio" className="rounded-full px-3 py-2 transition hover:bg-white/10 active:scale-[0.99]">
          Portfolio
        </a>
        <a href={`/profile/${userId}`} className="rounded-full px-3 py-2 transition hover:bg-white/10 active:scale-[0.99]">
          Profile
        </a>
      </div>
    </nav>
  );
}

