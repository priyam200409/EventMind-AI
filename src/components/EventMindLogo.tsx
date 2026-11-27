'use client';

export function EventMindLogo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <img
      src="/icon.svg?v=2"
      alt="EventMind AI Logo"
      className={`${className} shrink-0 rounded-xl object-cover shadow-sm`}
    />
  );
}