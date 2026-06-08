import VowelsPractice from './VowelsPractice';
import { getBasicVowels } from '../../data/vowels';

export default function VowelsSingle1() {
    return (
        <VowelsPractice
            singleVowels={getBasicVowels()}
            centeringDiphthongs={null}
            glidingDiphthongs={null}
            triphthongs={null}
            title="Vowels: Basics"
        />
    );
}
