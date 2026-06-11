import React from 'react';
import { Bug, Loader2, Send, X } from 'lucide-react';
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

function getUiScale() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1;
}

function getCssPxVar(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return parseFloat(value) || 0;
}

function getViewportSize() {
  const visual = window.visualViewport;
  const scale = getUiScale();
  return {
    width: Math.round((visual?.width || window.innerWidth || 390) / scale),
    height: Math.round((visual?.height || window.innerHeight || 844) / scale),
  };
}

function eventPoint(event) {
  const scale = getUiScale();
  return {
    x: event.clientX / scale - getCssPxVar('--app-viewport-offset-left'),
    y: event.clientY / scale - getCssPxVar('--app-viewport-offset-top'),
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
  return { blob };
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
  const [submitState, setSubmitState] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const [buttonPosition, setButtonPosition] = React.useState(readSavedButtonPosition);
  const [isDraggingButton, setIsDraggingButton] = React.useState(false);
  const lastShakeRef = React.useRef(0);
  const dragRef = React.useRef(null);
  const buttonPositionRef = React.useRef(buttonPosition);

  const resetDraft = React.useCallback(() => {
    setDescription('');
    setScreenshot(null);
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
      setCaptureState('ready');
    } catch {
      setScreenshot(null);
      setCaptureState('failed');
    }
  }, []);

  const openReporter = React.useCallback(() => {
    if (isOpen) return;
    resetDraft();
    setIsOpen(true);
    window.setTimeout(startCapture, 80);
  }, [isOpen, resetDraft, startCapture]);

  const closeReporter = React.useCallback(() => {
    setIsOpen(false);
  }, []);

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
    buttonPositionRef.current = buttonPosition;
  }, [buttonPosition]);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') closeReporter();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeReporter]);

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
    if (event.button !== undefined && event.button !== 0) return;
    const point = eventPoint(event);
    const current = buttonPositionRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      offsetX: point.x - current.x,
      offsetY: point.y - current.y,
      moved: false,
    };
    setIsDraggingButton(false);
    event.preventDefault();
  };

  React.useEffect(() => {
    const handlePointerMove = event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const point = eventPoint(event);
      const distance = Math.hypot(point.x - drag.startX, point.y - drag.startY);
      if (distance < 6 && !drag.moved) return;

      event.preventDefault();
      drag.moved = true;
      setIsDraggingButton(true);

      const { width } = getViewportSize();
      const nextX = Math.min(Math.max(EDGE_GAP, point.x - drag.offsetX), Math.max(EDGE_GAP, width - BUTTON_SIZE - EDGE_GAP));
      const nextY = clampButtonY(point.y - drag.offsetY);
      setButtonPosition({
        edge: nextX < width / 2 ? 'left' : 'right',
        x: nextX,
        y: nextY,
      });
    };

    const finishButtonDrag = event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      dragRef.current = null;

      if (!drag.moved) {
        setIsDraggingButton(false);
        if (event.type === 'pointerup') openReporter();
        return;
      }
      const point = eventPoint(event);
      const { width } = getViewportSize();
      const currentX = Math.min(Math.max(EDGE_GAP, point.x - drag.offsetX), Math.max(EDGE_GAP, width - BUTTON_SIZE - EDGE_GAP));
      const edge = currentX < width / 2 ? 'left' : 'right';
      const next = positionForEdge(edge, point.y - drag.offsetY);
      saveButtonPosition(next);
      setButtonPosition(next);
      window.setTimeout(() => {
        setIsDraggingButton(false);
      }, 80);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', finishButtonDrag);
    window.addEventListener('pointercancel', finishButtonDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishButtonDrag);
      window.removeEventListener('pointercancel', finishButtonDrag);
    };
  }, [openReporter]);

  const handleButtonKeyDown = event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openReporter();
  };

  const buttonStyle = {
    left: `calc(var(--app-viewport-offset-left) + ${buttonPosition.x}px)`,
    top: `calc(var(--app-viewport-offset-top) + ${buttonPosition.y}px)`,
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const body = description.trim();
    if (body.length < 4 || submitState === 'submitting') return;

    setSubmitState('submitting');
    setMessage('');

    let screenshotUrl = '';
    let screenshotKey = '';

    if (screenshot?.blob) {
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
        style={buttonStyle}
        aria-label="Report a problem"
        title="Report a problem"
        onPointerDown={handlePointerDown}
        onKeyDown={handleButtonKeyDown}
      >
        <Bug size={21} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="feedback-modal-shell" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="feedback-modal-backdrop" onPointerDown={closeReporter} onClick={closeReporter} />
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
