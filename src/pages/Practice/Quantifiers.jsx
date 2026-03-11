import DrillPractice from './DrillPractice';
import data from '../../data/drills/quantifiers.json';

export default function Quantifiers() {
    return <DrillPractice data={data} questionCount={10} />;
}
