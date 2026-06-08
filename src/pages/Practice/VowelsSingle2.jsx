import VowelsPractice from './VowelsPractice';
import { getSpecialVowels } from '../../data/vowels';

export default function VowelsSingle2() {
    return (
        <VowelsPractice
            singleVowels={getSpecialVowels()}
            centeringDiphthongs={null}
            glidingDiphthongs={null}
            triphthongs={null}
            title="Vowels: Special"
        />
    );
}
