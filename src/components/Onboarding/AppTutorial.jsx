import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowRight, CheckCircle, Navigation } from 'lucide-react';
import { useT } from '../../lib/i18n';
import { useUser } from '../../context/UserContext';
import { getLine } from '../../lib/mascot';
import BeKhe from '../BeKhe/BeKhe';
import './AppTutorial.css';

// ─── Tutorial step definitions ────────────────────────────────────────────────
// Each step:
//   tab         — which tab the user must be on
//   targetId    — DOM element id to spotlight (null = no spotlight, center tooltip)
//   targetClass — fallback querySelector if no id (first match)
//   position    — tooltip placement: 'top' | 'bottom' | 'center'
//   emoji       — badge emoji
//   badge       — badge label
//   title       — tooltip headline
//   desc        — tooltip body
//   tabLabel    — if defined, shown as "switching to X" hint

const STEP_DEFS = [
    {
        tab: 'study',
        targetId: 'roadmap-continue-btn',
        position: 'center',
        badge: 'app_tutorial_roadmap_badge',
        title: 'app_tutorial_roadmap_title',
        desc: 'app_tutorial_roadmap_desc',
        tabLabel: 'nav_study',
        mascotSlot: 'roadmap',
    },
    {
        tab: 'dictionary',
        targetId: 'dict-search-input',
        position: 'bottom',
        badge: 'app_tutorial_dictionary_badge',
        title: 'app_tutorial_dictionary_title',
        desc: 'app_tutorial_dictionary_desc',
        tabLabel: 'nav_dictionary',
    },
    {
        tab: 'library',
        targetId: 'library-tag-bar',
        position: 'top',
        badge: 'app_tutorial_library_badge',
        title: 'app_tutorial_library_title',
        desc: 'app_tutorial_library_desc',
        tabLabel: 'nav_library',
    },
    {
        tab: 'library',
        targetClass: '.bottom-nav',
        position: 'top',
        badge: 'app_tutorial_navigation_badge',
        title: 'app_tutorial_navigation_title',
        desc: 'app_tutorial_navigation_desc',
        mascotSlot: 'done',
    },
];

// ─── Helper: get the .app-container's bounding rect ────────────────────────
function getContainerRect() {
    const el = document.querySelector('.app-container');
    return el ? el.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 };
}

// ─── Helper: get bounding rect for a step, relative to the .app-container ────
function getRect(step) {
    let el = null;
    if (step.targetId) el = document.getElementById(step.targetId);
    if (!el && step.targetClass) el = document.querySelector(step.targetClass);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = getContainerRect();
    return {
        top: r.top - c.top,
        left: r.left - c.left,
        width: r.width,
        height: r.height,
    };
}

const PAD = 8; // spotlight padding around element

// ─── AppTutorial component ────────────────────────────────────────────────────
const AppTutorial = ({ activeTab, setActiveTab, onComplete, allowedTabs }) => {
    const t = useT();
    const { userProfile } = useUser();
    const mascotLang = userProfile?.nativeLang || 'en';
    const [stepIdx, setStepIdx] = useState(0);
    const [rect, setRect] = useState(null);
    const [exiting, setExiting] = useState(false);
    const [switching, setSwitching] = useState(false);
    const tooltipRef = useRef(null);
    const rafRef = useRef(null);

    // In a shell, only tour the tabs that shell actually has.
    const defs = useMemo(
        () => (allowedTabs ? STEP_DEFS.filter(s => allowedTabs.includes(s.tab)) : STEP_DEFS),
        [allowedTabs]
    );

    const steps = defs.map(step => ({
        ...step,
        badge: t(step.badge),
        title: t(step.title),
        desc: t(step.desc),
        tabLabel: step.tabLabel ? t(step.tabLabel) : undefined,
    }));
    const step = steps[stepIdx];
    const isLast = stepIdx === steps.length - 1;
    const mascotLine = step.mascotSlot ? getLine('tutorial', { lang: mascotLang, slot: step.mascotSlot }) : null;

    // Align the active tab to the first step on mount — a shell can default to a
    // different tab than the tour's first step.
    useEffect(() => {
        const s = defs[0];
        if (s && activeTab !== s.tab) { setSwitching(true); setActiveTab(s.tab); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Switch tab if needed, then update rect ──────────────────────────────
    const applyStep = useCallback((idx) => {
        const s = defs[idx];
        if (!s) return;
        if (activeTab !== s.tab) {
            setSwitching(true);
            setActiveTab(s.tab);
        }
    }, [activeTab, setActiveTab, defs]);

    // Re-measure rect whenever tab settles or step changes.
    // Uses a retry loop (up to 1.5 s) so we wait for the element to appear
    // AND for any layout shift (e.g. Roadmap data loading) to finish.
    useEffect(() => {
        let attempts = 0;
        const MAX_ATTEMPTS = 20;   // 20 × 80 ms = 1.6 s max
        const INTERVAL = 80;
        let lastTop = null;
        let stableCount = 0;
        const STABLE_NEEDED = 2; // rect must be the same for 2 consecutive checks

        const tryMeasure = () => {
            const s = defs[stepIdx];
            if (!s || activeTab !== s.tab) return;

            const r = getRect(s);
            attempts++;

            if (!r) {
                // Element not in DOM yet — keep retrying
                if (attempts < MAX_ATTEMPTS) {
                    rafRef.current = setTimeout(tryMeasure, INTERVAL);
                } else {
                    // Give up, show tooltip without spotlight
                    setSwitching(false);
                    setRect(null);
                }
                return;
            }

            // Check for layout stability (top position unchanged)
            if (r.top === lastTop) {
                stableCount++;
            } else {
                stableCount = 0;
                lastTop = r.top;
            }

            if (stableCount >= STABLE_NEEDED) {
                // Position has settled — lock it in
                setSwitching(false);
                setRect(r);
            } else if (attempts < MAX_ATTEMPTS) {
                // Keep measuring until stable
                rafRef.current = setTimeout(tryMeasure, INTERVAL);
            } else {
                setSwitching(false);
                setRect(r);
            }
        };

        // Initial delay: longer for steps that require a tab switch
        const step = defs[stepIdx];
        const needsSwitch = step && activeTab !== step.tab;
        rafRef.current = setTimeout(tryMeasure, needsSwitch ? 200 : 80);

        return () => clearTimeout(rafRef.current);
    }, [stepIdx, activeTab, defs]);


    // ── Navigation ──────────────────────────────────────────────────────────
    const goNext = () => {
        if (isLast) {
            finish();
            return;
        }
        const nextIdx = stepIdx + 1;
        setStepIdx(nextIdx);
        applyStep(nextIdx);
    };

    const finish = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            localStorage.setItem('vnme_tutorial_completed', 'true');
            onComplete();
        }, 350);
    }, [onComplete]);

    // Tooltip is always a bottom sheet — never overlaps the spotlight

    // ── Compute tooltip position — always above or below the spotlight ───────
    const TOOLTIP_H = 240; // estimated tooltip height
    const GAP = 12;        // gap between spotlight edge and tooltip

    const getTooltipStyle = () => {
        if (!rect) {
            // No element found — center in bottom third
            return { position: 'absolute', bottom: '12px', left: '12px', right: '12px', maxHeight: 'calc(100vh - 40px)' };
        }

        const containerEl = document.querySelector('.mobile-app-wrapper') || document.querySelector('.app-container');
        const containerH = containerEl ? containerEl.clientHeight : window.innerHeight;

        const spotTop = rect.top - PAD;
        const spotBot = rect.top + rect.height + PAD;

        const spaceBelow = containerH - spotBot - GAP;
        const spaceAbove = spotTop - GAP;

        // If we place below: max height is whatever space is left down to bottom edge (minus safe margin)
        // If we place above: max height is whatever space is left up to top edge

        if (spaceBelow >= TOOLTIP_H) {
            // Enough room below
            return { position: 'absolute', top: spotBot + GAP, left: '12px', right: '12px', maxHeight: spaceBelow - 12 };
        } else if (spaceAbove >= TOOLTIP_H) {
            // Enough room above
            return { position: 'absolute', bottom: containerH - spotTop + GAP, left: '12px', right: '12px', maxHeight: spaceAbove - 12 };
        } else {
            // Not enough room either side — pick the side with MORE space!
            if (spaceBelow >= spaceAbove) {
                return { position: 'absolute', top: spotBot + GAP, left: '12px', right: '12px', maxHeight: Math.max(spaceBelow - 12, 160) };
            } else {
                return { position: 'absolute', bottom: containerH - spotTop + GAP, left: '12px', right: '12px', maxHeight: Math.max(spaceAbove - 12, 160) };
            }
        }
    };

    const tooltipStyle = getTooltipStyle();
    const spotlightStyle = rect
        ? {
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
        }
        : {
            // No matching element — hide the ring but keep the dark backdrop
            top: 0, left: 0, width: 0, height: 0,
            boxShadow: '0 0 0 9999px rgba(10,10,18,0.82)',
            borderRadius: 0,
        };

    return (
        <div
            className="tutorial-overlay"
            style={{
                opacity: exiting ? 0 : 1,
                transition: 'opacity 0.35s ease',
                pointerEvents: exiting ? 'none' : undefined,
            }}
        >
            {/* Clickable backdrop — tapping outside does nothing (intentional) */}
            <div className="tutorial-backdrop" onClick={(e) => e.stopPropagation()} />

            {/* Spotlight ring */}
            {!switching && (
                <div className="tutorial-spotlight" style={spotlightStyle} />
            )}

            {/* Tooltip card — dynamically positioned above or below the spotlight */}
            {!switching && (
                <div
                    key={`tooltip-${stepIdx}`}
                    ref={tooltipRef}
                    className="tutorial-tooltip"
                    style={tooltipStyle}
                >
                    {/* Tab switch hint */}
                    {step.tabLabel && stepIdx > 0 && defs[stepIdx - 1]?.tab !== step.tab && (
                        <div className="tutorial-tab-hint">
                            <Navigation size={12} />
                            {t('app_tutorial_moved_to').replace('{tab}', step.tabLabel)}
                        </div>
                    )}

                    {/* Step badge */}
                    <div className="tutorial-step-badge">
                        {step.badge}
                    </div>

                    {/* Content */}
                    <h3 className="tutorial-title">{step.title}</h3>
                    <p className="tutorial-desc">{step.desc}</p>

                    {/* Bé Khế chimes in on matching steps */}
                    {mascotLine && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 4 }}>
                            <BeKhe expression={mascotLine.expression} size={48} style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                                {mascotLine.text}
                            </p>
                        </div>
                    )}

                    {/* Progress dots */}
                    <div className="tutorial-progress">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`tutorial-dot ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="tutorial-actions">
                        <button className="tutorial-skip-btn" onClick={finish}>
                            {t('app_tutorial_skip')}
                        </button>
                        <button
                            className={`tutorial-next-btn ${isLast ? 'finish' : ''}`}
                            onClick={goNext}
                        >
                            {isLast ? (
                                <>
                                    <CheckCircle size={17} />
                                    {t('app_tutorial_lets_go')}
                                </>
                            ) : (
                                <>
                                    {t('app_tutorial_next')}
                                    <ArrowRight size={17} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Switching indicator */}
            {switching && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 140,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--surface-color, #1E1E2E)',
                        border: '1.5px solid rgba(255,183,3,0.3)',
                        borderRadius: 16,
                        padding: '14px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: '#FFB703',
                        fontWeight: 700,
                        fontSize: 14,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        pointerEvents: 'all',
                    }}
                >
                    <Navigation size={16} />
                    {t('app_tutorial_heading_to').replace('{tab}', step.tabLabel || step.tab)}
                </div>
            )}
        </div>
    );
};

export default AppTutorial;
