import DrillPractice from './DrillPractice';
import data from '../../../content/drills/aspect_markers.json';

export default function AspectMarkers() {
    return <DrillPractice data={data} questionCount={10} />;
}
