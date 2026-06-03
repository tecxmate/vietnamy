import DrillPractice from './DrillPractice';
import data from '../../../content/drills/intensifiers.json';

export default function Intensifiers() {
    return <DrillPractice data={data} questionCount={10} />;
}
