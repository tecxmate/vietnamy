import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, BookOpen, Layers, ChevronRight } from 'lucide-react';
import { useDong } from '../../context/DongContext';
import { getItems, getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { getDueItems } from '../../lib/srs';
import speak from '../../utils/speak';
import './HomeTab.css';

const TIPS = [
    { title: 'Six Tones', body: 'Vietnamese has 6 tones. The same syllable "ma" can mean ghost, mother, but, horse, tomb, or rice seedling — depending on the tone!' },
    { title: 'No Conjugation', body: 'Vietnamese verbs never change form. "Tôi ăn", "bạn ăn", "họ ăn" — the verb stays the same regardless of subject or tense.' },
    { title: 'Adjectives After Nouns', body: 'Unlike English, adjectives come AFTER the noun: "cà phê đen" literally means "coffee black".' },
    { title: 'Pronouns = Relationships', body: 'Vietnamese has dozens of pronouns based on age, gender, and relationship. "Anh" (older brother), "chị" (older sister), "em" (younger sibling) are all "you".' },
    { title: 'North vs South', body: 'Northern and Southern Vietnamese sound very different. "V" is pronounced "v" in the North but "y" in the South. "R" is "z" in the North but "r" in the South.' },
    { title: 'Classifiers Matter', body: 'Vietnamese uses classifiers before nouns: "một con chó" (an animal-dog), "một cái bàn" (a thing-table). "Con" for animals, "cái" for objects.' },
    { title: 'Question with "Không?"', body: 'Turn any statement into a yes/no question by adding "không?" at the end: "Bạn khỏe" (you\'re well) → "Bạn khỏe không?" (are you well?).' },
    { title: 'Numbers Are Easy', body: 'Vietnamese numbers are logical: 11 = "mười một" (ten-one), 21 = "hai mươi một" (two-ten-one). No irregular teens!' },
    { title: 'Phở Pronunciation', body: '"Phở" is pronounced "fuh" with a rising tone — not "foe". The hook above (ở) signals a broken rising tone.' },
    { title: '"Đ" vs "D"', body: '"Đ" (with a stroke) sounds like English "d". But plain "D" sounds like "z" in the North and "y" in the South — a common trap for beginners!' },
    { title: 'Time Words, Not Tenses', body: 'Instead of verb tenses, Vietnamese uses time markers: "đã" (past), "đang" (ongoing), "sẽ" (future). "Tôi đã ăn" = "I already ate".' },
    { title: 'The Magic of "Ơi"', body: '"Ơi" is how you call someone\'s attention. "Anh ơi!" (hey, older brother!), "Em ơi!" (hey, younger one!). You\'ll hear it everywhere.' },
    { title: 'Polite Particles', body: '"Ạ" at the end of a sentence makes it polite: "Cảm ơn ạ" (thank you, respectfully). Use it with elders and strangers.' },
    { title: 'TELEX Typing', body: 'Type Vietnamese on any keyboard with TELEX: "a" + "w" = "ă", "o" + "w" = "ơ". Tones: s=sắc, f=huyền, r=hỏi, x=ngã, j=nặng.' },
    { title: '"Xin" = Please / Ask', body: '"Xin chào" literally means "ask hello" — a formal greeting. "Xin lỗi" = "ask pardon" (sorry). "Xin" adds formality to any request.' },
];

function getWordOfTheDay(items) {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const words = items.filter(i => i.item_type === 'word' && i.en);
    if (words.length === 0) return null;
    return words[dayOfYear % words.length];
}

function getTodayTips() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const start = (dayOfYear * 3) % TIPS.length;
    const result = [];
    for (let i = 0; i < 3; i++) {
        result.push(TIPS[(start + i) % TIPS.length]);
    }
    return result;
}

const HomeTab = () => {
    const navigate = useNavigate();
    const { completedNodes } = useDong();

    const items = useMemo(() => getItems(), []);
    const wordOfDay = useMemo(() => getWordOfTheDay(items), [items]);
    const tips = useMemo(() => getTodayTips(), []);
    const dueCount = useMemo(() => getDueItems().length, []);

    const handleContinue = () => {
        const units = getUnits();
        for (const unit of units) {
            const nodes = getNodesForUnitWithProgress(unit.id, completedNodes);
            const activeNode = nodes.find(n => n.status === 'active');
            if (activeNode) {
                if (activeNode.type === 'lesson') navigate(`/lesson/${activeNode.content_ref_id}`);
                else if (activeNode.type === 'grammar_tip') navigate(`/grammar-lesson/${activeNode.id}`);
                else if (activeNode.type === 'skill' && activeNode.skill_content?.type === 'grammar_lesson') navigate(`/grammar-lesson/${activeNode.id}`);
                else if (activeNode.type === 'skill' && activeNode.skill_content?.route) navigate(activeNode.skill_content.route);
                else if (activeNode.type === 'test') navigate(`/test/${activeNode.id}`);
                else navigate(`/lesson/${activeNode.content_ref_id}`);
                return;
            }
        }
    };

    return (
        <div className="home-tab">
            {/* Word of the Day */}
            {wordOfDay && (
                <div className="home-wotd-card">
                    <div className="home-wotd-header">Word of the Day</div>
                    <div className="home-wotd-word">
                        <span className="home-wotd-vi">{wordOfDay.vi_text}</span>
                        <button className="home-speak-btn" onClick={() => speak(wordOfDay.vi_text)}>
                            <Volume2 size={18} />
                        </button>
                    </div>
                    <div className="home-wotd-en">{wordOfDay.en}</div>
                </div>
            )}

            {/* Tips */}
            <div className="home-section-header">
                <span>Tips & Tricks</span>
            </div>
            <div className="home-tips-scroll">
                {tips.map((tip, i) => (
                    <div key={i} className="home-tip-card">
                        <div className="home-tip-title">{tip.title}</div>
                        <div className="home-tip-body">{tip.body}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="home-actions">
                <button className="home-action-card home-action-study" onClick={handleContinue}>
                    <BookOpen size={22} />
                    <span>Continue Lesson</span>
                    <ChevronRight size={18} />
                </button>
                {dueCount > 0 && (
                    <button className="home-action-card home-action-review" onClick={() => navigate('/practice/flashcards')}>
                        <Layers size={22} />
                        <span>{dueCount} cards to review</span>
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default HomeTab;
