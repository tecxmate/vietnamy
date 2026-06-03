import DrillPractice from './DrillPractice';
import data from '../../../content/drills/question_words.json';

export default function QuestionWords() {
    return <DrillPractice data={data} questionCount={10} />;
}
