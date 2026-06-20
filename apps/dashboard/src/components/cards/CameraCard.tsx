import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { useConnectionStore } from '../../stores/connectionStore';
import { resolveEntityPicture } from '../../lib/media';
import type { HassEntity } from '@hapulse/core';
import './cards.css';

interface CameraCardProps {
  entity: HassEntity;
  name: string;
}

const REFRESH_INTERVAL_MS = 10_000;

/**
 * CameraCard — shows a camera snapshot.
 *
 * Uses the camera entity's `entity_picture` attribute, a pre-signed
 * `/api/camera_proxy/...?token=…` URL that HA serves for unauthenticated
 * `<img>` loads (the token is embedded and rotated by HA). This works in BOTH
 * OAuth mode (where no long-lived token is available to the app) and token mode,
 * and avoids the CORS preflight that an `Authorization`-header fetch triggers.
 * A periodic cache-buster re-requests the snapshot for a near-live view.
 */
export function CameraCard({ entity, name }: CameraCardProps) {
  const url = useConnectionStore((s) => s.url);
  const demo = useConnectionStore((s) => s.demo);

  const picture = entity.attributes['entity_picture'] as string | undefined;
  const base = demo ? null : resolveEntityPicture(picture, url || null);

  const [tick, setTick] = useState(0);
  const [failed, setFailed] = useState(false);

  // Reset the error state whenever the underlying picture URL changes
  // (e.g. HA rotated the signed token).
  useEffect(() => { setFailed(false); }, [base]);

  useEffect(() => {
    if (!base) return;
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [base]);

  const src = base ? `${base}${base.includes('?') ? '&' : '?'}_ts=${tick}` : null;

  if (!src || failed) {
    return (
      <div className="camera-card card">
        <div className="camera-card__placeholder">
          <Camera size={32} strokeWidth={1.5} />
          <span className="camera-card__placeholder-name">{name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-card card">
      <img src={src} alt={name} className="camera-card__img" onError={() => setFailed(true)} />
      <div className="camera-card__label">{name}</div>
    </div>
  );
}
