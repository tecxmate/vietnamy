import DrillPractice from './DrillPractice';
import data from '../../data/drills/degree_adverbs.json';

export default function DegreeAdverbs() {
    return <DrillPractice data={data} questionCount={10} />;
}
