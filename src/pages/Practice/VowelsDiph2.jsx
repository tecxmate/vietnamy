import VowelsPractice from './VowelsPractice';
import { getGlidingGroup1 } from '../../data/vowels';

export default function VowelsDiph2() {
    return (
        <VowelsPractice
            singleVowels={null}
            centeringDiphthongs={null}
            glidingDiphthongs={getGlidingGroup1()}
            triphthongs={null}
            title="Vowels: Gliding Diphthongs"
        />
    );
}
