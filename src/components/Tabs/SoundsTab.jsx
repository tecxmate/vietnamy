import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, Music, Sparkles, ChevronRight } from 'lucide-react';
import { TONE_LIST } from '../../data/toneContours';
import speak from '../../utils/speak';
import { useT } from '../../lib/i18n';
import ToneLesson from '../Sounds/ToneLesson';
import { getAlphabet } from '../../data/alphabet';

const alphabetTtsName = (item) => (item.ttsName || item.name).replace(/-/g, ' ');

// Vietnamese alphabet data
const VOWELS = {
    basic: [
        { letter: 'a', ipa: '/aː/', sound: '"ah" as in father', example: 'ba (three)' },
        { letter: 'ă', ipa: '/a/', sound: 'Short "ah"', example: 'ăn (eat)' },
        { letter: 'â', ipa: '/ə/', sound: '"uh" as in about', example: 'ân (grace)' },
        { letter: 'e', ipa: '/ɛ/', sound: '"e" as in bet', example: 'xe (vehicle)' },
        { letter: 'ê', ipa: '/e/', sound: '"ay" as in say', example: 'mê (infatuated)' },
        { letter: 'i/y', ipa: '/i/', sound: '"ee" as in see', example: 'đi (go)' },
        { letter: 'o', ipa: '/ɔ/', sound: '"aw" as in saw', example: 'bò (cow)' },
        { letter: 'ô', ipa: '/o/', sound: '"oh" as in go', example: 'cô (aunt)' },
        { letter: 'ơ', ipa: '/əː/', sound: 'Long "uh"', example: 'mơ (dream)' },
        { letter: 'u', ipa: '/u/', sound: '"oo" as in boot', example: 'thu (autumn)' },
        { letter: 'ư', ipa: '/ɯ/', sound: 'Unrounded "oo"', example: 'từ (word)' },
    ],
    diphthongs: [
        { letter: 'ai', ipa: '/aːj/', example: 'hai (two)' },
        { letter: 'ao', ipa: '/aːw/', example: 'cao (tall)' },
        { letter: 'au', ipa: '/aw/', example: 'sau (after)' },
        { letter: 'âu', ipa: '/əw/', example: 'đâu (where)' },
        { letter: 'ay', ipa: '/aj/', example: 'hay (or)' },
        { letter: 'ây', ipa: '/əj/', example: 'đây (here)' },
        { letter: 'eo', ipa: '/ɛw/', example: 'kẹo (candy)' },
        { letter: 'êu', ipa: '/ew/', example: 'kêu (call)' },
        { letter: 'ia/iê', ipa: '/iə/', example: 'bia (beer)' },
        { letter: 'iu', ipa: '/iw/', example: 'chịu (endure)' },
        { letter: 'oa', ipa: '/waː/', example: 'hoa (flower)' },
        { letter: 'oe', ipa: '/wɛ/', example: 'khoe (show off)' },
        { letter: 'oi', ipa: '/ɔj/', example: 'tôi (I)' },
        { letter: 'ôi', ipa: '/oj/', example: 'hồi (time)' },
        { letter: 'ơi', ipa: '/əːj/', example: 'ơi (hey)' },
        { letter: 'ua/uô', ipa: '/uə/', example: 'mua (buy)' },
        { letter: 'uê', ipa: '/we/', example: 'huê (Huế city)' },
        { letter: 'ui', ipa: '/uj/', example: 'vui (happy)' },
        { letter: 'ưa/ươ', ipa: '/ɯə/', example: 'mưa (rain)' },
        { letter: 'ưi', ipa: '/ɯj/', example: 'gửi (send)' },
        { letter: 'ưu', ipa: '/ɯw/', example: 'lưu (save)' },
    ],
    triphthongs: [
        { letter: 'iêu/yêu', ipa: '/iəw/', example: 'yêu (love)' },
        { letter: 'oai', ipa: '/waːj/', example: 'ngoài (outside)' },
        { letter: 'oao', ipa: '/waːw/', example: 'ngoao (meow)' },
        { letter: 'oay', ipa: '/waj/', example: 'xoay (rotate)' },
        { letter: 'oeo', ipa: '/wɛw/', example: 'ngoẹo (crooked)' },
        { letter: 'uây', ipa: '/wəj/', example: 'khuây (distracted)' },
        { letter: 'uôi', ipa: '/uəj/', example: 'chuối (banana)' },
        { letter: 'uya', ipa: '/wiə/', example: 'khuya (late night)' },
        { letter: 'uyê', ipa: '/wiə/', example: 'khuyên (advise)' },
        { letter: 'uyu', ipa: '/wiw/', example: 'khuỷu (elbow)' },
        { letter: 'ươi', ipa: '/ɯəj/', example: 'tươi (fresh)' },
        { letter: 'ươu', ipa: '/ɯəw/', example: 'hươu (deer)' },
    ],
};

const CONSONANTS = {
    initial: [
        { letter: 'b', ipa: '/ɓ/', sound: 'Like English "b"', example: 'ba' },
        { letter: 'c/k', ipa: '/k/', sound: 'Like English "k"', example: 'cá' },
        { letter: 'ch', ipa: '/c/', sound: 'Like "ch" in church', example: 'cho' },
        { letter: 'd', ipa: '/z/ (N) /j/ (S)', sound: '"z" North / "y" South', example: 'da' },
        { letter: 'đ', ipa: '/ɗ/', sound: 'Hard "d"', example: 'đi' },
        { letter: 'g/gh', ipa: '/ɣ/', sound: 'Soft "g"', example: 'gà' },
        { letter: 'gi', ipa: '/z/ (N) /j/ (S)', sound: '"z" North / "y" South', example: 'già' },
        { letter: 'h', ipa: '/h/', sound: 'Like English "h"', example: 'hai' },
        { letter: 'kh', ipa: '/x/', sound: 'Like "ch" in Bach', example: 'không' },
        { letter: 'l', ipa: '/l/', sound: 'Like English "l"', example: 'là' },
        { letter: 'm', ipa: '/m/', sound: 'Like English "m"', example: 'mẹ' },
        { letter: 'n', ipa: '/n/', sound: 'Like English "n"', example: 'nó' },
        { letter: 'ng/ngh', ipa: '/ŋ/', sound: 'Like "ng" in sing', example: 'ngày' },
        { letter: 'nh', ipa: '/ɲ/', sound: 'Like "ny" in canyon', example: 'nhà' },
        { letter: 'p', ipa: '/p/', sound: 'Like English "p"', example: 'pin' },
        { letter: 'ph', ipa: '/f/', sound: 'Like English "f"', example: 'phở' },
        { letter: 'qu', ipa: '/kw/', sound: 'Like English "kw"', example: 'quá' },
        { letter: 'r', ipa: '/z/ (N) /ʐ/ (S)', sound: '"z" North / retroflex South', example: 'rất' },
        { letter: 's', ipa: '/s/ (N) /ʂ/ (S)', sound: '"s" North / "sh" South', example: 'sáu' },
        { letter: 't', ipa: '/t/', sound: 'Like English "t"', example: 'tôi' },
        { letter: 'th', ipa: '/tʰ/', sound: 'Aspirated "t"', example: 'thì' },
        { letter: 'tr', ipa: '/c/ (N) /ʈ/ (S)', sound: '"ch" North / retroflex South', example: 'trà' },
        { letter: 'v', ipa: '/v/', sound: 'Like English "v"', example: 'và' },
        { letter: 'x', ipa: '/s/', sound: 'Like English "s"', example: 'xin' },
    ],
    final: [
        { letter: '-c/-ch', ipa: '/-k/', sound: 'Unreleased "k"', example: 'học, sách' },
        { letter: '-m', ipa: '/-m/', sound: 'Like English "-m"', example: 'ăn' },
        { letter: '-n', ipa: '/-n/', sound: 'Like English "-n"', example: 'ăn' },
        { letter: '-ng/-nh', ipa: '/-ŋ/', sound: 'Like "-ng" in sing', example: 'không, anh' },
        { letter: '-p', ipa: '/-p/', sound: 'Unreleased "p"', example: 'đẹp' },
        { letter: '-t', ipa: '/-t/', sound: 'Unreleased "t"', example: 'mặt' },
    ],
};

const SoundsTab = () => {
    const t = useT();
    const location = useLocation();
    // Deep-link (e.g. from the Grammar tab): open straight into the tone lesson.
    // The tab remounts when activated, so reading location.state on mount is enough.
    const deepLinkLesson = Boolean(location.state?.openToneLesson);
    const [activeSection, setActiveSection] = useState(deepLinkLesson ? 'tones' : 'alphabet');
    const [toneLessonOpen, setToneLessonOpen] = useState(deepLinkLesson);

    const playTTS = (text) => speak(text, 0.8, 'vi');

    if (toneLessonOpen) {
        return <ToneLesson onExit={() => setToneLessonOpen(false)} />;
    }

    const sections = [
        { id: 'alphabet', label: t('sounds_section_alphabet') },
        { id: 'tones', label: t('sounds_section_tones') },
        { id: 'vowels', label: t('sounds_section_vowels') },
        { id: 'consonants', label: t('sounds_section_consonants') },
    ];

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{
                padding: '24px 16px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        backgroundColor: 'rgba(28,176,246,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Music size={24} color="#1CB0F6" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{t('sounds_title')}</h1>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                            {t('sounds_subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Section Tabs */}
            <div style={{
                display: 'flex',
                gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                {sections.map(sec => (
                    <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `2px solid ${activeSection === sec.id ? '#1CB0F6' : 'var(--border-color)'}`,
                            backgroundColor: activeSection === sec.id ? 'rgba(28,176,246,0.12)' : 'transparent',
                            color: activeSection === sec.id ? '#1CB0F6' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {sec.label}
                    </button>
                ))}
            </div>

            {/* Alphabet Section */}
            {activeSection === 'alphabet' && (
                <div style={{ padding: 16 }}>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {t('sounds_alphabet_intro')}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {getAlphabet().map((item, i) => (
                            <div
                                key={i}
                                onClick={() => playTTS(alphabetTtsName(item))}
                                style={{
                                    padding: '12px 8px',
                                    borderRadius: 12,
                                    backgroundColor: 'var(--surface-color)',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: 24, fontWeight: 700, color: '#1CB0F6', marginBottom: 4 }}>
                                    {item.letter}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {item.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tones Section */}
            {activeSection === 'tones' && (
                <div style={{ padding: 16 }}>
                    {/* Interactive lesson CTA */}
                    <button
                        onClick={() => setToneLessonOpen(true)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 18px',
                            marginBottom: 18,
                            borderRadius: 16,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textAlign: 'left',
                            background: 'linear-gradient(135deg, #1CB0F6 0%, #1289d8 100%)',
                            boxShadow: '0 6px 16px rgba(28,176,246,0.35)',
                        }}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sparkles size={26} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                                {t('sounds_tone_lesson_cta', 'Interactive tone lesson')}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                                {t('sounds_tone_lesson_sub', 'Learn · Identify · Speak with AI feedback')}
                            </div>
                        </div>
                        <ChevronRight size={22} color="#fff" style={{ flexShrink: 0 }} />
                    </button>

                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {t('sounds_tone_reference', 'Tone reference')}
                    </div>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {t('sounds_tones_intro')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {TONE_LIST.map(tone => (
                            <div
                                key={tone.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    padding: '14px 16px',
                                    borderRadius: 14,
                                    backgroundColor: 'var(--surface-color)',
                                    border: `2px solid ${tone.color}40`,
                                }}
                            >
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    backgroundColor: `${tone.color}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, fontWeight: 700,
                                    color: tone.color,
                                }}>
                                    {tone.mark}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>
                                            {tone.name}
                                        </span>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600,
                                            padding: '2px 8px', borderRadius: 6,
                                            backgroundColor: `${tone.color}20`,
                                            color: tone.color,
                                        }}>
                                            {t(`sounds_tone_${tone.id}_label`, tone.label)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {t(`sounds_tone_${tone.id}_desc`, tone.description)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => playTTS(tone.mark)}
                                    style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: `${tone.color}20`,
                                        color: tone.color,
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Tone comparison */}
                    <div style={{
                        marginTop: 20,
                        padding: 16,
                        borderRadius: 14,
                        backgroundColor: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
                            {t('sounds_tone_comparison')}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {[
                                { word: 'ma', tone: t('sounds_ma_ghost'), color: '#4CAF50' },
                                { word: 'má', tone: t('sounds_ma_mom'), color: '#2196F3' },
                                { word: 'mà', tone: t('sounds_ma_but'), color: '#9C27B0' },
                                { word: 'mả', tone: t('sounds_ma_tomb'), color: '#FF9800' },
                                { word: 'mã', tone: t('sounds_ma_horse'), color: '#E91E63' },
                                { word: 'mạ', tone: t('sounds_ma_seedling'), color: '#795548' },
                            ].map(item => (
                                <button
                                    key={item.word}
                                    onClick={() => playTTS(item.word)}
                                    style={{
                                        padding: '10px 8px',
                                        borderRadius: 10,
                                        border: `1px solid ${item.color}40`,
                                        backgroundColor: `${item.color}10`,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.word}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.tone}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Vowels Section */}
            {activeSection === 'vowels' && (
                <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            {t('sounds_single_vowels')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {VOWELS.basic.map(v => (
                                <div
                                    key={v.letter}
                                    onClick={() => playTTS(v.example.split(' ')[0])}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 10,
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s',
                                    }}
                                >
                                    <span style={{ fontSize: 22, fontWeight: 700, color: '#1CB0F6', minWidth: 36 }}>{v.letter}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 40 }}>{v.ipa}</span>
                                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-main)' }}>{t(`sounds_vowel_basic_${VOWELS.basic.indexOf(v)}_sound`, v.sound)}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.example}</span>
                                    <Volume2 size={16} color="#1CB0F6" style={{ flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            {t('sounds_diphthongs')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                            {VOWELS.diphthongs.map(v => (
                                <div
                                    key={v.letter}
                                    onClick={() => playTTS(v.example.split(' ')[0])}
                                    style={{
                                        padding: '10px 12px', borderRadius: 10,
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1CB0F6' }}>{v.letter}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.ipa}</span>
                                        <Volume2 size={14} color="#1CB0F6" style={{ marginLeft: 'auto' }} />
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{v.example}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            {t('sounds_triphthongs')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                            {VOWELS.triphthongs.map(v => (
                                <div
                                    key={v.letter}
                                    onClick={() => playTTS(v.example.split(' ')[0])}
                                    style={{
                                        padding: '10px 12px', borderRadius: 10,
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA' }}>{v.letter}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.ipa}</span>
                                        <Volume2 size={14} color="#A78BFA" style={{ marginLeft: 'auto' }} />
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{v.example}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Consonants Section */}
            {activeSection === 'consonants' && (
                <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            {t('sounds_initial_consonants')}
                        </h3>
                        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                            {t('sounds_dialect_note')}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {CONSONANTS.initial.map(c => (
                                <div
                                    key={c.letter}
                                    onClick={() => playTTS(c.example)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 10,
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: 18, fontWeight: 700, color: '#06D6A0', minWidth: 44 }}>{c.letter}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 70 }}>{c.ipa}</span>
                                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-main)' }}>{t(`sounds_consonant_initial_${CONSONANTS.initial.indexOf(c)}_sound`, c.sound)}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.example}</span>
                                    <Volume2 size={16} color="#06D6A0" style={{ flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            {t('sounds_final_consonants')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {CONSONANTS.final.map(c => (
                                <div
                                    key={c.letter}
                                    onClick={() => playTTS(c.example.split(',')[0].trim())}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 10,
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: 18, fontWeight: 700, color: '#EF476F', minWidth: 60 }}>{c.letter}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 50 }}>{c.ipa}</span>
                                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-main)' }}>{t(`sounds_consonant_final_${CONSONANTS.final.indexOf(c)}_sound`, c.sound)}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.example}</span>
                                    <Volume2 size={16} color="#EF476F" style={{ flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoundsTab;
