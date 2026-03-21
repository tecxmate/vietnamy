import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, MoreVertical, Download } from 'lucide-react';
import './InstallPrompt.css';

function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState('unknown'); // 'ios-safari', 'android-chrome', 'desktop-chrome'

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return;
    }

    // Don't show if user dismissed recently (7 days)
    const dismissed = localStorage.getItem('vnme_install_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect platform
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
    const isAndroid = /Android/.test(ua);

    if (isIOS && isSafari) {
      setPlatform('ios-safari');
      // Show after a short delay so the app loads first
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }

    if (isIOS && !isSafari) {
      // iOS but not Safari - can't install from other browsers
      setPlatform('ios-other');
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge on Android or desktop - listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform(isAndroid ? 'android-chrome' : 'desktop-chrome');
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallChrome = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('vnme_install_dismissed', String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="install-prompt-overlay" onClick={handleDismiss}>
      <div className="install-prompt" onClick={(e) => e.stopPropagation()}>
        <button className="install-prompt-close" onClick={handleDismiss} aria-label="Close">
          <X size={18} />
        </button>

        <div className="install-prompt-header">
          <img src="/icon.png" alt="Vietnamy" className="install-prompt-icon" />
          <div>
            <h3>Install Vietnamy</h3>
            <p>Add to your home screen for a full-screen app experience</p>
          </div>
        </div>

        {platform === 'ios-safari' && (
          <div className="install-prompt-steps">
            <div className="install-step">
              <Share size={20} />
              <span>Tap the <strong>Share</strong> button in the toolbar</span>
            </div>
            <div className="install-step">
              <PlusSquare size={20} />
              <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
            </div>
          </div>
        )}

        {platform === 'ios-other' && (
          <div className="install-prompt-steps">
            <p className="install-note">Open this page in <strong>Safari</strong> to add it to your home screen.</p>
          </div>
        )}

        {(platform === 'android-chrome' || platform === 'desktop-chrome') && (
          <div className="install-prompt-steps">
            <button className="install-btn" onClick={handleInstallChrome}>
              <Download size={18} />
              Install App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstallPrompt;
