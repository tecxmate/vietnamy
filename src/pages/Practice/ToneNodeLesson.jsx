import { useParams } from 'react-router-dom';
import ToneLesson from '../../components/Sounds/ToneLesson';
import { TONE_LIST } from '../../data/toneContours';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';

// The tone ladder: tones are introduced a couple at a time in contrasting pairs
// (hear-only: learn the pitch shape, then identify by ear), with a final
// production node. Each entry is one roadmap node (/practice/tones/<level>).
const LEVELS = {
    level1: { tones: ['ngang', 'huyen'], steps: ['learn', 'identify'], title: 'Level vs Falling' },
    level2: { tones: ['ngang', 'huyen', 'sac'], steps: ['learn', 'identify'], title: 'Add the Rising tone' },
    level3: { tones: ['ngang', 'huyen', 'sac', 'hoi'], steps: ['learn', 'identify'], title: 'Add the Dipping tone' },
    level4: { tones: ['hoi', 'nga'], steps: ['learn', 'identify'], title: 'Hỏi vs Ngã — the tricky pair' },
    level5: { tones: ['ngang', 'sac', 'huyen', 'hoi', 'nga', 'nang'], steps: ['learn', 'identify'], title: 'All 6 tones together' },
    speak: { tones: ['ngang', 'sac', 'huyen', 'hoi', 'nga', 'nang'], steps: ['speak'], title: 'Say the tones' },
};

export default function ToneNodeLesson() {
    const { level } = useParams();
    const cfg = LEVELS[level] || LEVELS.level1;
    const tones = cfg.tones.map(id => TONE_LIST.find(t => t.id === id)).filter(Boolean);
    const { markComplete, goNext, goBack } = usePracticeCompletion();

    return (
        <ToneLesson
            tones={tones}
            steps={cfg.steps}
            title={cfg.title}
            onExit={goBack}
            onComplete={() => { markComplete(); goNext(); }}
        />
    );
}
