import DrillPractice from './DrillPractice';
import data from '../../../content/drills/prepositions.json';

export default function Prepositions() {
    return <DrillPractice data={data} questionCount={10} />;
}
