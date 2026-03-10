import ToneMarks from './ToneMarks';

const SPECIAL_VOWELS = ['ă', 'â', 'ê', 'ô', 'ơ', 'ư'];

export default function ToneMarksSpecial() {
    return <ToneMarks vowels={SPECIAL_VOWELS} title="🔤 Tone Marks: Special" />;
}
