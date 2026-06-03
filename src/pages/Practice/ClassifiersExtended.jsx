import DrillPractice from './DrillPractice';
import data from '../../../content/drills/classifiers_extended.json';

export default function ClassifiersExtended() {
    return <DrillPractice data={data} questionCount={10} />;
}
