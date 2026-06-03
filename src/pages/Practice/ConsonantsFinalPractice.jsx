import DrillPractice from './DrillPractice';
import data from '../../../content/drills/consonants_final.json';

export default function ConsonantsFinalPractice() {
    return <DrillPractice data={data} questionCount={10} />;
}
