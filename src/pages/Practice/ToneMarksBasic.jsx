import ToneMarks from './ToneMarks';

const BASIC_VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];

export default function ToneMarksBasic() {
    return <ToneMarks vowels={BASIC_VOWELS} title="🔤 Tone Marks: Basics" />;
}
