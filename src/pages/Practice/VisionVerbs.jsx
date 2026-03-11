import DrillPractice from './DrillPractice';
import data from '../../data/drills/vision_verbs.json';

export default function VisionVerbs() {
    return <DrillPractice data={data} questionCount={10} />;
}
