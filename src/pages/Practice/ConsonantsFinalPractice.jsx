import DrillPractice from './DrillPractice';
import data from '../../data/drills/consonants_final.json';

export default function ConsonantsFinalPractice() {
    return <DrillPractice data={data} questionCount={10} />;
}
