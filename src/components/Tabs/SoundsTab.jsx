import React, { useState } from 'react';
import { Volume2, Music } from 'lucide-react';
import { TONE_LIST } from '../../data/toneContours';
import speak from '../../utils/speak';

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

// Vietnamese alphabet (29 letters)
const ALPHABET = [
    { letter: 'A a', name: 'a', sound: 'ah' },
    { letter: 'Ă ă', name: 'á', sound: 'a (short)' },
    { letter: 'Â â', name: 'ớ', sound: 'uh' },
    { letter: 'B b', name: 'bê', sound: 'beh' },
    { letter: 'C c', name: 'xê', sound: 'seh' },
    { letter: 'D d', name: 'dê', sound: 'zeh/yeh' },
    { letter: 'Đ đ', name: 'đê', sound: 'deh' },
    { letter: 'E e', name: 'e', sound: 'eh' },
    { letter: 'Ê ê', name: 'ê', sound: 'ay' },
    { letter: 'G g', name: 'giê', sound: 'zheh' },
    { letter: 'H h', name: 'hát', sound: 'haht' },
    { letter: 'I i', name: 'i', sound: 'ee' },
    { letter: 'K k', name: 'ca', sound: 'kah' },
    { letter: 'L l', name: 'e-lờ', sound: 'el-uh' },
    { letter: 'M m', name: 'em-mờ', sound: 'em-uh' },
    { letter: 'N n', name: 'en-nờ', sound: 'en-uh' },
    { letter: 'O o', name: 'o', sound: 'aw' },
    { letter: 'Ô ô', name: 'ô', sound: 'oh' },
    { letter: 'Ơ ơ', name: 'ơ', sound: 'uh (long)' },
    { letter: 'P p', name: 'pê', sound: 'peh' },
    { letter: 'Q q', name: 'quy', sound: 'kwee' },
    { letter: 'R r', name: 'e-rờ', sound: 'er-uh' },
    { letter: 'S s', name: 'ét-sì', sound: 'et-see' },
    { letter: 'T t', name: 'tê', sound: 'teh' },
    { letter: 'U u', name: 'u', sound: 'oo' },
    { letter: 'Ư ư', name: 'ư', sound: 'uh (unrounded)' },
    { letter: 'V v', name: 'vê', sound: 'veh' },
    { letter: 'X x', name: 'ích-xì', sound: 'eek-see' },
    { letter: 'Y y', name: 'y dài', sound: 'ee' },
];

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
    const [activeSection, setActiveSection] = useState('alphabet');

    const playTTS = (text) => speak(text, 0.8, 'vi');

    const sections = [
        { id: 'alphabet', label: 'Alphabet' },
        { id: 'tones', label: 'Tones' },
        { id: 'vowels', label: 'Vowels' },
        { id: 'consonants', label: 'Consonants' },
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
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Sounds & Alphabet</h1>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                            Vietnamese pronunciation reference
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
                        The Vietnamese alphabet has 29 letters. It uses the Latin script with additional diacritics.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {ALPHABET.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => playTTS(item.letter.split(' ')[0])}
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
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Vietnamese has 6 tones. The same syllable with different tones means completely different words.
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
                                            {tone.label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {tone.description}
                                    </div>
                                </div>
                                <button
                                    onClick={() => playTTS(tone.id === 'ngang' ? 'ma' : tone.id === 'sac' ? 'má' : tone.id === 'huyen' ? 'mà' : tone.id === 'hoi' ? 'mả' : tone.id === 'nga' ? 'mã' : 'mạ')}
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
                            Same syllable, different tones
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {[
                                { word: 'ma', tone: 'ghost', color: '#4CAF50' },
                                { word: 'má', tone: 'mom', color: '#2196F3' },
                                { word: 'mà', tone: 'but', color: '#9C27B0' },
                                { word: 'mả', tone: 'tomb', color: '#FF9800' },
                                { word: 'mã', tone: 'horse', color: '#E91E63' },
                                { word: 'mạ', tone: 'rice seedling', color: '#795548' },
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
                            Single Vowels
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
                                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-main)' }}>{v.sound}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.example}</span>
                                    <Volume2 size={16} color="#1CB0F6" style={{ flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            Diphthongs (2 vowels)
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
                            Triphthongs (3 vowels)
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
                            Initial Consonants
                        </h3>
                        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                            (N) = Northern dialect, (S) = Southern dialect
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
                                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-main)' }}>{c.sound}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.example}</span>
                                    <Volume2 size={16} color="#06D6A0" style={{ flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                            Final Consonants
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
                                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-main)' }}>{c.sound}</span>
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
