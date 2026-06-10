import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import curriculum from '../../content/curriculum.json';
import { getNextBestLessons } from '../lib/sequencer';

// Sequencer-powered "Recommended for you" row (Layer 3 activation).
// Additive: sits above the visible roadmap; the linear path is unchanged. Picks
// the next lessons by purpose-fit + difficulty-fit + variety, constrained by the
// grammar prerequisite graph. Tapping a card jumps to that lesson.
const REAL_PURPOSES = ['explore_vietnam', 'professional', 'heritage'];
const TOPIC_COLOR = { explore_vietnam: '#1CB0F6', professional: '#A78BFA', heritage: '#EF476F' };

export default function RecommendedNext({ completedNodeIds, purpose }) {
    const navigate = useNavigate();

    const recs = useMemo(() => {
        const lessons = curriculum.lessons || [];
        const nodeToLesson = new Map(lessons.filter(l => l.nodeId).map(l => [l.nodeId, l]));
        const completed = [...(completedNodeIds || [])].map(id => nodeToLesson.get(id)).filter(Boolean);
        const estimatedLevel = completed.length
            ? Math.min(10, Math.max(1, Math.round(completed.reduce((s, l) => s + (l.difficulty || 3), 0) / completed.length) + 1))
            : 2;
        const recentTopics = [...completed]
            .sort((a, b) => (b.orderIndex ?? 0) - (a.orderIndex ?? 0))
            .slice(0, 3).map(l => l.topic);
        const realPurpose = REAL_PURPOSES.includes(purpose) ? purpose : 'explore_vietnam';
        return getNextBestLessons(
            { completedLessonIds: completed.map(l => l.id), purpose: realPurpose, estimatedLevel, recentTopics },
            lessons, { limit: 3 },
        );
    }, [completedNodeIds, purpose]);

    if (!recs.length) return null;
    const accent = TOPIC_COLOR[purpose] || 'var(--primary-color)';

    return (
        <div style={{ padding: '14px 16px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={16} color={accent} />
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Recommended for you
                </span>
            </div>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {recs.map(({ lesson, spine }) => (
                    <button
                        key={lesson.id}
                        onClick={() => navigate(`/lesson/${lesson.id}`)}
                        style={{
                            flex: '0 0 auto', width: 160, textAlign: 'left', cursor: 'pointer',
                            background: 'var(--surface-color)', border: `2px solid ${accent}30`,
                            borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '12px 14px',
                            fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                    >
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: accent }}>
                            {spine ? 'Core' : lesson.topic} · {lesson.cefrLevel}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25 }}>
                            {lesson.title}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: accent, marginTop: 2 }}>
                            Start <ChevronRight size={14} />
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
