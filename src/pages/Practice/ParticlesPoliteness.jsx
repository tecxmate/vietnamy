import DrillPractice from './DrillPractice';
import data from '../../../content/drills/particles_politeness.json';

export default function ParticlesPoliteness() {
    return <DrillPractice data={data} questionCount={10} />;
}
