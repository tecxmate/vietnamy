import React from 'react';
import './Modal.css';

/**
 * Modal — the shared bottom-sheet shell.
 *
 * Renders a full-screen dimmed backdrop (tap to close) and a bottom-anchored
 * sheet that slides up. Children supply the sheet's own header + body, so each
 * caller keeps its content layout; this unifies the overlay, backdrop tap-to-
 * close, slide-up animation, rounded top, max-width and stacking (one z-index
 * instead of the previous ad-hoc 200 / 9999 / … per modal).
 *
 * Built on the existing `.modal-overlay` + `.slide-up` convention (index.css).
 */
export default function Modal({ onClose, children, sheetClassName = '', maxWidth = 480, maxHeight = '85vh' }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`ui-sheet slide-up ${sheetClassName}`}
                style={{ maxWidth, maxHeight }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
