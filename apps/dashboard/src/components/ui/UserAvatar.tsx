/**
 * UserAvatar — 44px circle showing the signed-in Home Assistant user.
 *
 * Shows the user's entity_picture when available, falling back to
 * the first letter of their name on the accent-soft background.
 *
 * When `interactive` (default true), renders as a <button> that navigates
 * to /settings. Pass `interactive={false}` for the Settings page identity row.
 */

import React from 'react';
import { useNavigate } from 'react-router';
import './UserAvatar.css';

export interface UserAvatarProps {
  name: string;
  pictureUrl: string | null;
  initial: string;
  /** Whether the avatar is clickable and navigates to /settings. Default: true. */
  interactive?: boolean;
}

export function UserAvatar({ name, pictureUrl, initial, interactive = true }: UserAvatarProps) {
  const navigate = useNavigate();

  const inner = pictureUrl ? (
    <img
      src={pictureUrl}
      alt={name}
      className="user-avatar__img"
      draggable={false}
    />
  ) : (
    <span className="user-avatar__initial" aria-hidden="true">
      {initial}
    </span>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className="user-avatar user-avatar--interactive"
        aria-label={`signed in as ${name} — open settings`}
        title={name}
        onClick={() => navigate('/settings')}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className="user-avatar"
      title={name}
      aria-label={`signed in as ${name}`}
    >
      {inner}
    </div>
  );
}
