import React from 'react';
import './home.css';

interface GreetingBlockProps {
  userName?: string | undefined;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Overview greeting — "Good morning, Alex 👋" + subtitle.
 * The user avatar / weather / bell live in the app shell header, not here.
 */
export function GreetingBlock({ userName }: GreetingBlockProps) {
  const greeting = getGreeting();
  const name = userName?.trim();

  return (
    <div className="greeting">
      <h1 className="greeting__title">
        {name ? `${greeting}, ${name}` : greeting} <span aria-hidden="true">👋</span>
      </h1>
      <p className="greeting__subtitle">Here's what's happening in your home.</p>
    </div>
  );
}
