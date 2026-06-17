import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, RotateCcw, FastForward } from 'lucide-react';
import { getUnits, getNodesForUnitWithProgress } from '../lib/roadmapDb';

// Sequencer-powered "Recommended for you" row (Layer 3 activation).
// Additive: sits above the visible roadmap; the linear path is unchanged. Picks
// the next lessons by purpose-fit + difficulty-fit + variety, constrained by the
// grammar prerequisite graph. Tapping a lesson card opens the Study preview.
// Picks beyond the roadmap's linear unlock are honest about it: labelled "Skip ahead"
// (grammar-prereq-safe by construction, but ahead of the visible path order).
const TOPIC_COLOR = { explore_vietnam: '#1CB0F6', professional: '#A78BFA', heritage: '#EF476F' };

export default function RecommendedNext({ completedNodeIds, purpose, onLessonSelect }) {
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState({ recs: [], dueCount: 0 });

    useEffect(() => {
        let cancelled = false;

        import('../lib/recommendations').then(({ getRecommendations }) => {
            if (cancelled) return;
            const result = getRecommendations(completedNodeIds, purpose, { limit: 3 });
            // Roadmap-reachable node ids (active or completed) under linear unlock —
            // anything else the sequencer picked is a skip-ahead.
            const reachable = new Set();
            try {
                for (const unit of getUnits()) {
                    for (const n of getNodesForUnitWithProgress(unit.id, completedNodeIds)) {
                        if (n.status === 'active' || n.status === 'completed') reachable.add(n.id);
                    }
                }
            } catch { /* roadmap data unavailable — skip labelling */ }
            setRecommendations({
                ...result,
                recs: result.recs.map(r => ({
                    ...r,
                    ahead: reachable.size > 0 && r.lesson?.nodeId ? !reachable.has(r.lesson.nodeId) : false,
                })),
            });
        }).catch(() => {
            if (!cancelled) setRecommendations({ recs: [], dueCount: 0 });
        });

        return () => {
            cancelled = true;
        };
    }, [completedNodeIds, purpose]);

    const { recs, dueCount } = recommendations;

    if (!recs.length && !dueCount) return null;
    const accent = TOPIC_COLOR[purpose] || 'var(--primary-color)';
    const selectLesson = (lessonId) => {
        if (onLessonSelect) onLessonSelect(lessonId);
        else navigate(`/lesson/${lessonId}`);
    };

    return (
        <div style={{ padding: '14px 16px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={16} color={accent} />
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Recommended for you
                </span>
            </div>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {dueCount > 0 && (
                    <button
                        key="__review__"
                        onClick={() => navigate('/', { state: { vocabDeck: '__srs__' } })}
                        style={{
                            flex: '0 0 auto', width: 160, textAlign: 'left', cursor: 'pointer',
                            background: 'var(--surface-color)', border: '2px solid #06D6A030',
                            borderLeft: '4px solid #06D6A0', borderRadius: 14, padding: '12px 14px',
                            fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                    >
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#06D6A0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RotateCcw size={11} /> Review
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25 }}>
                            {dueCount} word{dueCount === 1 ? '' : 's'} due
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: '#06D6A0', marginTop: 2 }}>
                            Practice <ChevronRight size={14} />
                        </span>
                    </button>
                )}
                {recs.map(({ lesson, spine, ahead }) => (
                    <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson.id)}
                        onPointerUp={() => selectLesson(lesson.id)}
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: accent, marginTop: 2 }}>
                            {ahead ? <>Skip ahead <FastForward size={13} /></> : <>Start <ChevronRight size={14} /></>}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
