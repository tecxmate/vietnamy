import DrillPractice from './DrillPractice';
import data from '../../../content/drills/connectors.json';

export default function Connectors() {
    return <DrillPractice data={data} questionCount={10} />;
}
