/**
 * Onboarding page — HA OAuth sign-in (primary), LLAT connect (advanced), demo mode.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { AlertTriangle, Lock, ChevronDown } from 'lucide-react';
import { PulseLogo } from '../components/ui/PulseLogo';
import { DashboardBootLoading } from '../components/ui/DashboardBootLoading';
import { useConnectionStore } from '../stores/connectionStore';
import { HAAuthError, HAConnectionError } from '@hapulse/core';
import './Onboarding.css';

function detectMixedContent(url: string): boolean {
  return (
    window.location.protocol === 'https:' &&
    (url.startsWith('http://') || url.startsWith('ws://'))
  );
}

/** True when the current URL contains the HA auth callback query param. */
function isAuthCallback(): boolean {
  return window.location.search.includes('auth_callback=1');
}

export function Onboarding() {
  const { status, error: storeError, signInWithHomeAssistant, connect, startDemo } =
    useConnectionStore(
      useShallow((s) => ({
        status: s.status,
        error: s.error,
        signInWithHomeAssistant: s.signInWithHomeAssistant,
        connect: s.connect,
        startDemo: s.startDemo,
      }))
    );

  const navigate = useNavigate();

  // ---- Redirect when already connected ----
  useEffect(() => {
    if (status === 'connected') {
      navigate('/', { replace: true });
    }
  }, [status, navigate]);

  // ---- Primary OAuth form ----
  const [oauthUrl, setOauthUrl] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // ---- Advanced token form ----
  const [tokenUrl, setTokenUrl] = useState('');
  const [token, setToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ---- Mixed-content warnings ----
  const oauthMixedContent = oauthUrl.length > 0 && detectMixedContent(oauthUrl);
  const tokenMixedContent = tokenUrl.length > 0 && detectMixedContent(tokenUrl);

  // ---- Callback leg: store error (from init()) is shown on the form ----
  const callbackFailed = isAuthCallback() && storeError;

  // ---- OAuth sign-in ----
  async function handleOAuthSignIn(e: React.FormEvent) {
    e.preventDefault();
    setOauthError(null);

    const trimmedUrl = oauthUrl.trim().replace(/\/+$/, '');
    if (!trimmedUrl) {
      setOauthError('Please enter your Home Assistant URL.');
      return;
    }
    if (detectMixedContent(trimmedUrl)) {
      setOauthError(
        'Mixed content blocked: this page is served over HTTPS but your HA URL uses HTTP. ' +
        'Use your Nabu Casa URL (https://…ui.nabu.casa) or set up a reverse proxy with HTTPS.'
      );
      return;
    }

    setOauthLoading(true);
    try {
      // This triggers a redirect — page navigates away; never resolves on success.
      await signInWithHomeAssistant(trimmedUrl);
    } catch (err) {
      if (err instanceof HAAuthError) {
        setOauthError('Sign-in failed: invalid response from Home Assistant.');
      } else if (err instanceof HAConnectionError) {
        setOauthError(`Could not reach Home Assistant: ${err.message}`);
      } else {
        setOauthError('Something went wrong. Check the URL and try again.');
      }
      setOauthLoading(false);
    }
    // If redirect happens the component unmounts — no finally needed.
  }

  // ---- Token connect ----
  async function handleTokenConnect(e: React.FormEvent) {
    e.preventDefault();
    setTokenError(null);

    const trimmedUrl = tokenUrl.trim().replace(/\/+$/, '');
    const trimmedToken = token.trim();

    if (!trimmedUrl) {
      setTokenError('Please enter your Home Assistant URL.');
      return;
    }
    if (!trimmedToken) {
      setTokenError('Please enter your long-lived access token.');
      return;
    }
    if (detectMixedContent(trimmedUrl)) {
      setTokenError(
        'Mixed content blocked: this page is served over HTTPS but your HA URL uses HTTP. ' +
        'Use your Nabu Casa URL or set up a reverse proxy with HTTPS.'
      );
      return;
    }

    setTokenLoading(true);
    try {
      await connect(trimmedUrl, trimmedToken);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof HAAuthError) {
        setTokenError(
          'Token rejected — create a long-lived access token in your HA profile → Security.'
        );
      } else if (err instanceof HAConnectionError) {
        setTokenError(`Could not reach Home Assistant: ${(err as Error).message}`);
      } else {
        setTokenError('Something went wrong. Check the URL and token and try again.');
      }
    } finally {
      setTokenLoading(false);
    }
  }

  function handleDemo() {
    startDemo();
    navigate('/', { replace: true });
  }

  // ---- Connecting/connected: show the branded loader instead of the form ----
  // Covers the OAuth callback leg (init() resuming), an in-flight sign-in, and
  // the brief window after a successful connect while the redirect effect above
  // navigates to "/". Keeps the loading animation seamless with the boot gate.
  if (status === 'connecting' || status === 'connected') {
    return <DashboardBootLoading label={isAuthCallback() ? 'Finishing sign-in…' : 'Connecting…'} />;
  }

  return (
    <div className="onboarding">
      <div className="onboarding__bg" aria-hidden="true" />

      <div className="onboarding__card stagger-rise">
        <header className="onboarding__header">
          <PulseLogo size={48} />
          <h1 className="onboarding__title">HAPulse</h1>
          <p className="onboarding__tagline">
            your home assistant, beautifully simplified
          </p>
        </header>

        {/* ---- Primary: OAuth sign-in ---- */}
        <form className="onboarding__form" onSubmit={handleOAuthSignIn} noValidate>
          <div className="onboarding__field">
            <label htmlFor="ha-url-oauth" className="onboarding__label">
              Home Assistant URL
            </label>
            <input
              id="ha-url-oauth"
              type="url"
              className="onboarding__input"
              placeholder="http://homeassistant.local:8123"
              value={oauthUrl}
              onChange={(e) => {
                setOauthUrl(e.target.value);
                setOauthError(null);
              }}
              autoComplete="url"
              spellCheck={false}
              disabled={oauthLoading}
            />
          </div>

          {oauthMixedContent && (
            <div className="onboarding__warning" role="alert">
              <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                This page is served over HTTPS — your browser will block connections to
                plain HTTP. Use your Nabu Casa URL or a reverse-proxied HTTPS address.
              </span>
            </div>
          )}

          {/* Show store error if callback failed */}
          {(oauthError || callbackFailed) && (
            <div className="onboarding__error" role="alert">
              {oauthError ?? storeError}
            </div>
          )}

          <button
            type="submit"
            className="onboarding__connect-btn"
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                redirecting to Home Assistant…
              </>
            ) : (
              'sign in with home assistant'
            )}
          </button>
        </form>

        <p className="onboarding__oauth-hint">
          <Lock size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
          you'll sign in on your home assistant's own login page — your password never touches hapulse.
        </p>

        {/* ---- Advanced: long-lived access token ---- */}
        <div className="onboarding__advanced">
          <button
            type="button"
            className="onboarding__advanced-toggle"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`onboarding__advanced-chevron${showAdvanced ? ' onboarding__advanced-chevron--open' : ''}`}
              aria-hidden="true"
            />
            advanced: connect with an access token
          </button>

          {showAdvanced && (
            <form
              className="onboarding__form onboarding__advanced-form"
              onSubmit={handleTokenConnect}
              noValidate
            >
              <div className="onboarding__field">
                <label htmlFor="ha-url-token" className="onboarding__label">
                  Home Assistant URL
                </label>
                <input
                  id="ha-url-token"
                  type="url"
                  className="onboarding__input"
                  placeholder="http://homeassistant.local:8123"
                  value={tokenUrl}
                  onChange={(e) => {
                    setTokenUrl(e.target.value);
                    setTokenError(null);
                  }}
                  autoComplete="url"
                  spellCheck={false}
                  disabled={tokenLoading}
                />
              </div>

              {tokenMixedContent && (
                <div className="onboarding__warning" role="alert">
                  <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    This page is served over HTTPS — your browser will block connections to
                    plain HTTP. Use your Nabu Casa URL or a reverse-proxied HTTPS address.
                  </span>
                </div>
              )}

              <div className="onboarding__field">
                <label htmlFor="ha-token" className="onboarding__label">
                  Long-lived access token
                </label>
                <input
                  id="ha-token"
                  type="password"
                  className="onboarding__input"
                  placeholder="••••••••••••••••"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setTokenError(null);
                  }}
                  autoComplete="current-password"
                  spellCheck={false}
                  disabled={tokenLoading}
                />
              </div>

              {tokenError && (
                <div className="onboarding__error" role="alert">
                  {tokenError}
                </div>
              )}

              <button
                type="submit"
                className="onboarding__connect-btn onboarding__connect-btn--secondary"
                disabled={tokenLoading}
              >
                {tokenLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    connecting…
                  </>
                ) : (
                  'Connect with access token'
                )}
              </button>

              <p className="onboarding__token-hint">
                <Lock size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
                your token is stored only in this browser
              </p>
            </form>
          )}
        </div>

        <div className="onboarding__divider" aria-hidden="true">or</div>

        <button
          type="button"
          className="onboarding__demo-btn"
          onClick={handleDemo}
          disabled={oauthLoading || tokenLoading}
        >
          Explore the demo home
        </button>
      </div>
    </div>
  );
}
