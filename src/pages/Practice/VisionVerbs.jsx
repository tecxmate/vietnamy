import DrillPractice from './DrillPractice';
import data from '../../../content/drills/vision_verbs.json';

export default function VisionVerbs() {
    return <DrillPractice data={data} questionCount={10} />;
}
