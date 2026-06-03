import DrillPractice from './DrillPractice';
import data from '../../../content/drills/question_words_advanced.json';

export default function QuestionWordsAdvanced() {
    return <DrillPractice data={data} questionCount={10} />;
}
