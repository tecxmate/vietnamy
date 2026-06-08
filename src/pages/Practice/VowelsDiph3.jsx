import VowelsPractice from './VowelsPractice';
import { getGlidingGroup2 } from '../../data/vowels';

export default function VowelsDiph3() {
    return (
        <VowelsPractice
            singleVowels={null}
            centeringDiphthongs={null}
            glidingDiphthongs={getGlidingGroup2()}
            triphthongs={null}
            title="Vowels: Advanced Sounds"
        />
    );
}
