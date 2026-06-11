import React from 'react';
import { Bug, ImageOff, Loader2, Send, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getClientLogs } from '../lib/clientDiagnostics';
import './FeedbackReporter.css';

const SHAKE_ENABLED = import.meta.env.VITE_FEEDBACK_SHAKE_ENABLED === 'true';
const MAX_SCREENSHOT_WIDTH = 1280;
const BUTTON_SIZE = 44;
const EDGE_GAP = 12;
const BUTTON_POSITION_KEY = 'vnme_feedback_button_position';

function getViewport() {
  const visual = window.visualViewport;
  return `${Math.round(visual?.width || window.innerWidth)}x${Math.round(visual?.height || window.innerHeight)}`;
}

function getViewportSize() {
  const visual = window.visualViewport;
  return {
    width: Math.round(visual?.width || window.innerWidth || 390),
    height: Math.round(visual?.height || window.innerHeight || 844),
  };
}

function clampButtonY(y) {
  const { height } = getViewportSize();
  return Math.min(Math.max(EDGE_GAP, y), Math.max(EDGE_GAP, height - BUTTON_SIZE - EDGE_GAP));
}

function positionForEdge(edge, y) {
  const { width, height } = getViewportSize();
  const defaultY = height - BUTTON_SIZE - 110;
  const safeY = clampButtonY(Number.isFinite(y) ? y : defaultY);
  return {
    edge: edge === 'left' ? 'left' : 'right',
    x: edge === 'left' ? EDGE_GAP : Math.max(EDGE_GAP, width - BUTTON_SIZE - EDGE_GAP),
    y: safeY,
  };
}

function readSavedButtonPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(BUTTON_POSITION_KEY) || 'null');
    return positionForEdge(saved?.edge, saved?.y);
  } catch {
    return positionForEdge('right');
  }
}

function saveButtonPosition(position) {
  localStorage.setItem(BUTTON_POSITION_KEY, JSON.stringify({
    edge: position.edge,
    y: Math.round(position.y),
  }));
}

function buildMetadata(language) {
  return {
    language,
    url: window.location.href,
    referrer: document.referrer || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    pixelRatio: window.devicePixelRatio || 1,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    visualViewport: getViewport(),
    online: navigator.onLine,
  };
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function captureViewport() {
  const { default: html2canvas } = await import('html2canvas');
  const root = document.querySelector('.mobile-app-wrapper') || document.body;
  const canvas = await html2canvas(root, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim() || '#121212',
    ignoreElements: element => element?.classList?.contains('feedback-reporter') || element?.classList?.contains('feedback-modal-shell'),
    logging: false,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  });

  const ratio = Math.min(1, MAX_SCREENSHOT_WIDTH / canvas.width);
  const output = ratio < 1 ? document.createElement('canvas') : canvas;
  if (ratio < 1) {
    output.width = Math.round(canvas.width * ratio);
    output.height = Math.round(canvas.height * ratio);
    const context = output.getContext('2d');
    context.drawImage(canvas, 0, 0, output.width, output.height);
  }

  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob) throw new Error('Screenshot capture failed.');
  return {
    blob,
    previewUrl: await blobToDataUrl(blob),
  };
}

async function uploadScreenshot(blob) {
  const response = await fetch('/api/feedback-screenshot', {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/jpeg' },
    body: blob,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Screenshot upload failed.');
  }
  return result;
}

export default function FeedbackReporter() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [captureState, setCaptureState] = React.useState('idle');
  const [screenshot, setScreenshot] = React.useState(null);
  const [attachScreenshot, setAttachScreenshot] = React.useState(true);
  const [submitState, setSubmitState] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const [buttonPosition, setButtonPosition] = React.useState(readSavedButtonPosition);
  const [isDraggingButton, setIsDraggingButton] = React.useState(false);
  const longPressRef = React.useRef(null);
  const lastShakeRef = React.useRef(0);
  const dragRef = React.useRef(null);
  const suppressNextClickRef = React.useRef(false);

  const resetDraft = React.useCallback(() => {
    setDescription('');
    setScreenshot(null);
    setAttachScreenshot(true);
    setCaptureState('idle');
    setSubmitState('idle');
    setMessage('');
  }, []);

  const startCapture = React.useCallback(async () => {
    setCaptureState('capturing');
    setMessage('');
    try {
      const shot = await captureViewport();
      setScreenshot(shot);
      setAttachScreenshot(true);
      setCaptureState('ready');
    } catch (error) {
      setScreenshot(null);
      setAttachScreenshot(false);
      setCaptureState('failed');
      setMessage(error?.message || 'Screenshot unavailable. You can still submit the report.');
    }
  }, []);

  const openReporter = React.useCallback(() => {
    if (isOpen) return;
    resetDraft();
    setIsOpen(true);
    window.setTimeout(startCapture, 80);
  }, [isOpen, resetDraft, startCapture]);

  const closeReporter = () => {
    if (submitState === 'submitting') return;
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (!SHAKE_ENABLED || isOpen) return undefined;
    const handleMotion = event => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;
      const magnitude = Math.abs(acceleration.x || 0) + Math.abs(acceleration.y || 0) + Math.abs(acceleration.z || 0);
      const now = Date.now();
      if (magnitude > 34 && now - lastShakeRef.current > 1800) {
        lastShakeRef.current = now;
        openReporter();
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isOpen, openReporter]);

  React.useEffect(() => {
    const handleResize = () => {
      setButtonPosition(current => {
        const next = positionForEdge(current.edge, current.y);
        saveButtonPosition(next);
        return next;
      });
    };
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  const handlePointerDown = event => {
    window.clearTimeout(longPressRef.current);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - buttonPosition.x,
      offsetY: event.clientY - buttonPosition.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    longPressRef.current = window.setTimeout(openReporter, 520);
  };

  const clearLongPress = React.useCallback(() => {
    window.clearTimeout(longPressRef.current);
  }, []);

  const handlePointerMove = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance < 6 && !drag.moved) return;

    clearLongPress();
    drag.moved = true;
    setIsDraggingButton(true);

    const { width } = getViewportSize();
    const nextX = Math.min(Math.max(EDGE_GAP, event.clientX - drag.offsetX), Math.max(EDGE_GAP, width - BUTTON_SIZE - EDGE_GAP));
    const nextY = clampButtonY(event.clientY - drag.offsetY);
    setButtonPosition({
      edge: nextX < width / 2 ? 'left' : 'right',
      x: nextX,
      y: nextY,
    });
  };

  const finishButtonDrag = event => {
    const drag = dragRef.current;
    clearLongPress();
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;

    if (!drag.moved) return;
    suppressNextClickRef.current = true;
    const { width } = getViewportSize();
    const currentX = Math.min(Math.max(EDGE_GAP, event.clientX - drag.offsetX), Math.max(EDGE_GAP, width - BUTTON_SIZE - EDGE_GAP));
    const edge = currentX < width / 2 ? 'left' : 'right';
    const next = positionForEdge(edge, event.clientY - drag.offsetY);
    saveButtonPosition(next);
    setButtonPosition(next);
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
      setIsDraggingButton(false);
    }, 80);
  };

  const handleButtonClick = event => {
    if (suppressNextClickRef.current || isDraggingButton) {
      event.preventDefault();
      return;
    }
    openReporter();
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const body = description.trim();
    if (body.length < 4 || submitState === 'submitting') return;

    setSubmitState('submitting');
    setMessage('');

    let screenshotUrl = '';
    let screenshotKey = '';

    if (attachScreenshot && screenshot?.blob) {
      try {
        const upload = await uploadScreenshot(screenshot.blob);
        screenshotUrl = upload.url || '';
        screenshotKey = upload.key || '';
      } catch (error) {
        screenshotUrl = '';
        screenshotKey = '';
        setMessage(error?.message || 'Screenshot upload failed. Submitting text report only.');
      }
    }

    const payload = {
      kind: 'bug',
      severity: 'med',
      subject: `In-app report: ${location.pathname}`,
      body,
      name: profile?.fullName || profile?.name || user?.user_metadata?.full_name || '',
      email: user?.email || '',
      userId: user?.id || 'anonymous',
      pathname: `${location.pathname}${location.search || ''}`,
      viewport: getViewport(),
      screenshotUrl,
      clientLogs: getClientLogs(),
      metadata: {
        ...buildMetadata(language),
        screenshotAttached: Boolean(screenshotUrl),
        screenshotKey,
        captureState,
      },
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit report.');
      setSubmitState('sent');
      setMessage('Report sent.');
      window.setTimeout(() => setIsOpen(false), 900);
    } catch (error) {
      setSubmitState('error');
      setMessage(error?.message || 'Could not submit report.');
    }
  };

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <>
      <button
        type="button"
        className={`feedback-reporter ${isDraggingButton ? 'feedback-reporter-dragging' : ''}`}
        style={{ left: buttonPosition.x, top: buttonPosition.y }}
        aria-label="Report a problem"
        title="Report a problem"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishButtonDrag}
        onPointerCancel={finishButtonDrag}
        onClick={handleButtonClick}
      >
        <Bug size={21} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="feedback-modal-shell" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="feedback-modal-backdrop" onClick={closeReporter} />
          <form className="feedback-modal" onSubmit={handleSubmit}>
            <div className="feedback-modal-header">
              <div>
                <h2 id="feedback-title">Report a problem</h2>
                <p>{location.pathname}</p>
              </div>
              <button type="button" className="feedback-icon-button" onClick={closeReporter} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="feedback-screenshot-panel">
              {captureState === 'capturing' && (
                <div className="feedback-screenshot-placeholder">
                  <Loader2 size={24} className="feedback-spin" />
                  <span>Capturing screen...</span>
                </div>
              )}
              {captureState === 'failed' && (
                <div className="feedback-screenshot-placeholder">
                  <ImageOff size={24} />
                  <span>Screenshot unavailable</span>
                </div>
              )}
              {screenshot?.previewUrl && captureState === 'ready' && (
                <>
                  <img src={screenshot.previewUrl} alt="Screenshot preview" />
                  <label className="feedback-checkbox">
                    <input
                      type="checkbox"
                      checked={attachScreenshot}
                      onChange={event => setAttachScreenshot(event.target.checked)}
                    />
                    Attach screenshot
                  </label>
                </>
              )}
            </div>

            <label className="feedback-field">
              <span>What went wrong?</span>
              <textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Describe what you expected and what happened."
                rows={5}
              />
            </label>

            {message && <div className={`feedback-message feedback-message-${submitState}`}>{message}</div>}

            <div className="feedback-actions">
              <button type="button" className="feedback-secondary" onClick={closeReporter}>
                Cancel
              </button>
              <button type="submit" className="feedback-primary" disabled={description.trim().length < 4 || submitState === 'submitting'}>
                {submitState === 'submitting' ? <Loader2 size={18} className="feedback-spin" /> : <Send size={18} />}
                <span>{submitState === 'submitting' ? 'Sending' : 'Send'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
