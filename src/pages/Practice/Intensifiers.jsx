import DrillPractice from './DrillPractice';
import data from '../../data/drills/intensifiers.json';

export default function Intensifiers() {
    return <DrillPractice data={data} questionCount={10} />;
}
