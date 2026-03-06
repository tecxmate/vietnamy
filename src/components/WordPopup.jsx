import React, { useState, useEffect } from 'react';
import { Volume2, ArrowRight, Bookmark } from 'lucide-react';
import speak from '../utils/speak';

const popupCache = new Map();

const WordPopup = ({ word, anchorRect, dictMode, onClose, onNavigate, isPhrase, onSave }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const lang = dictMode === 'zh-s' || dictMode === 'zh-t' ? 'zh' : (dictMode || 'en');

    useEffect(() => {
        const cacheKey = `${word.toLowerCase()}|${lang}`;

        if (popupCache.has(cacheKey)) {
            setData(popupCache.get(cacheKey));
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetch(`/api/word-popup?q=${encodeURIComponent(word)}&lang=${encodeURIComponent(lang)}`)
            .then(r => r.json())
            .then(result => {
                if (cancelled) return;

                if (result.found) {
                    popupCache.set(cacheKey, result);
                    setData(result);
                    setLoading(false);
                } else {
                    // Fallback: Google Translate
                    const tl = lang === 'zh' ? 'zh-CN' : (lang === 'en' ? 'en' : lang);
                    fetch(`/api/translate?text=${encodeURIComponent(word)}&sl=vi&tl=${encodeURIComponent(tl)}`)
                        .then(r => r.ok ? r.json() : Promise.reject())
                        .then(tr => {
                            if (cancelled) return;
                            const definition = tr.translated && tr.translated.toLowerCase() !== word.toLowerCase()
                                ? tr.translated : null;
                            const fallback = {
                                word,
                                found: false,
                                translated: !!definition,
                                definition,
                                pos: null,
                                ipa: null,
                            };
                            popupCache.set(cacheKey, fallback);
                            setData(fallback);
                            setLoading(false);
                        })
                        .catch(() => {
                            if (!cancelled) { setData({ word, found: false }); setLoading(false); }
                        });
                }
            })
            .catch(() => {
                if (!cancelled) { setData({ word, found: false }); setLoading(false); }
            });

        return () => { cancelled = true; };
    }, [word, lang]);

    // Position
    const style = {};
    if (anchorRect) {
        const viewH = window.innerHeight;
        const viewW = window.innerWidth;
        const margin = 12;
        const popupW = 260;

        let left = anchorRect.left + anchorRect.width / 2 - popupW / 2;
        left = Math.max(margin, Math.min(left, viewW - popupW - margin));
        style.left = left;
        style.width = popupW;

        if (anchorRect.top > viewH * 0.4) {
            style.bottom = viewH - anchorRect.top + 6;
        } else {
            style.top = anchorRect.bottom + 6;
        }
    }

    return (
        <div className="word-popup-overlay" onClick={onClose}>
            <div className="word-popup-card" style={style} onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="word-popup-loading">Looking up...</div>
                ) : data ? (
                    <>
                        <div className="word-popup-header">
                            <span className="word-popup-word">{word}</span>
                            <button
                                className="speak-btn speak-btn--sm"
                                onClick={() => speak(word)}
                                title="Listen"
                            >
                                <Volume2 size={16} />
                            </button>
                        </div>
                        {data.ipa && <span className="word-popup-ipa">/{data.ipa}/</span>}
                        {data.pos && <span className="word-popup-pos">{data.pos}</span>}
                        {data.definition ? (
                            <p className="word-popup-def">
                                {data.definition}
                                {data.translated && <span className="word-popup-badge">GT</span>}
                            </p>
                        ) : (
                            <p className="word-popup-def word-popup-def--empty">No definition found</p>
                        )}
                        <div className="word-popup-actions">
                            {onSave && (
                                <button
                                    className="word-popup-save"
                                    onClick={() => onSave(word)}
                                >
                                    <Bookmark size={13} /> Save
                                </button>
                            )}
                            <button
                                className="word-popup-more"
                                onClick={() => onNavigate(word)}
                            >
                                More <ArrowRight size={12} />
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default WordPopup;
