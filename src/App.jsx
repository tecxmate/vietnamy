import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Contexts
import { LanguageProvider } from './context/LanguageContext';
import { DongProvider } from './context/DongContext';
import { UserProvider, useUser } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';

// Tabs & Layout
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import AppTutorial from './components/Onboarding/AppTutorial';
import BottomNav from './components/BottomNav';
import { NotificationToastStack, NotificationPanel } from './components/NotificationToast';
import TopBar from './components/TopBar';
import InstallPrompt from './components/InstallPrompt';
import HomeTab from './components/Tabs/HomeTab';
import RoadmapTab from './components/Tabs/RoadmapTab';
import DictionaryTab from './components/Tabs/DictionaryTab';
import ReadingLibraryTab from './components/Tabs/ReadingLibraryTab';
// FlashcardsPage merged into Library > Vocabulary
import PracticeTab from './components/Tabs/PracticeTab';
import ScenesTab from './components/Tabs/ScenesTab';

// Grammar pages
import GrammarList from './pages/Grammar/GrammarList';
import GrammarDetail from './pages/Grammar/GrammarDetail';

// Admin CMS
import AdminLayout from './pages/Admin/AdminLayout';
import RoadmapMapper from './pages/Admin/RoadmapMapper';
import LessonBuilder from './pages/Admin/LessonBuilder';
import GrammarEditor from './pages/Admin/GrammarEditor';
import ArticleEditor from './pages/Admin/ArticleEditor';
import VocabEditor from './pages/Admin/VocabEditor';
import ToneWordEditor from './pages/Admin/ToneWordEditor';
import KinshipEditor from './pages/Admin/KinshipEditor';
import DrillEditor from './pages/Admin/DrillEditor';

// Main Content
import LessonGame from './components/LessonGame';
import SceneEngine from './components/Scene/SceneEngine';
import GrammarLesson from './pages/GrammarLesson';
import UnitTest from './pages/UnitTest';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';
// Practice Modules
// Pronouns sub-modules
import KinshipFoundation from './pages/Practice/KinshipFoundation';
import Pronouns1 from './pages/Practice/Pronouns1';
import Pronouns2 from './pages/Practice/Pronouns2';
import KinshipEngine from './pages/Practice/KinshipEngine';
import KinshipCalculator from './pages/Practice/KinshipCalculator';
// TELEX sub-modules
import TelexTyping1 from './pages/Practice/TelexTyping1';
import TelexTyping2 from './pages/Practice/TelexTyping2';
import TelexTyping3 from './pages/Practice/TelexTyping3';
// Teen Code sub-modules
import TeenCode1 from './pages/Practice/TeenCode1';
import TeenCode2 from './pages/Practice/TeenCode2';
import TeenCode3 from './pages/Practice/TeenCode3';
// Tone Practice sub-modules
import TonePractice1 from './pages/Practice/TonePractice1';
import TonePractice2 from './pages/Practice/TonePractice2';
import TonePractice3 from './pages/Practice/TonePractice3';
import TonePractice4 from './pages/Practice/TonePractice4';
// Tone Marks sub-modules
import ToneMarksBasic from './pages/Practice/ToneMarksBasic';
import ToneMarksSpecial from './pages/Practice/ToneMarksSpecial';
import ToneMarksMaster from './pages/Practice/ToneMarksMaster';
// Vowels sub-modules
import VowelsSingle1 from './pages/Practice/VowelsSingle1';
import VowelsSingle2 from './pages/Practice/VowelsSingle2';
import VowelsDiph1 from './pages/Practice/VowelsDiph1';
import VowelsDiph2 from './pages/Practice/VowelsDiph2';
import VowelsDiph3 from './pages/Practice/VowelsDiph3';
// Numbers sub-modules
import NumbersPractice1 from './pages/Practice/NumbersPractice1';
import NumbersPractice2 from './pages/Practice/NumbersPractice2';
import NumbersPractice3 from './pages/Practice/NumbersPractice3';
// Pitch Training sub-modules
import TonePitchTraining1 from './pages/Practice/TonePitchTraining1';
import TonePitchTraining2 from './pages/Practice/TonePitchTraining2';
// Drill-based practice modules (data-driven, CMS-editable)
import ConsonantsPractice from './pages/Practice/ConsonantsPractice';
import ClassifiersBasics from './pages/Practice/ClassifiersBasics';
import ClassifiersExtended from './pages/Practice/ClassifiersExtended';
import ParticlesPoliteness from './pages/Practice/ParticlesPoliteness';
import ParticlesEmotion from './pages/Practice/ParticlesEmotion';
import QuestionWords from './pages/Practice/QuestionWords';
import QuestionWordsAdvanced from './pages/Practice/QuestionWordsAdvanced';
import AspectMarkers from './pages/Practice/AspectMarkers';
// Grammar drill modules (Units 26-30 + prepositions)
import Connectors from './pages/Practice/Connectors';
import Intensifiers from './pages/Practice/Intensifiers';
import DegreeAdverbs from './pages/Practice/DegreeAdverbs';
import Quantifiers from './pages/Practice/Quantifiers';
import VisionVerbs from './pages/Practice/VisionVerbs';
import Prepositions from './pages/Practice/Prepositions';

function StudentApp({ initialTab = 'home' }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('vnme_onboarding_completed') === 'true';
  });
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem('vnme_tutorial_completed') === 'true';
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabSubtitle, setTabSubtitle] = useState(null);
  const [pendingDictInput, setPendingDictInput] = useState(null);
  const { updateUserProfile } = useUser();

  const handleDictInput = (text) => {
    updateUserProfile({ dictMode: 'all' });
    setPendingDictInput(text);
    setActiveTab('dictionary');
  };

  const [pendingLibraryArticle, setPendingLibraryArticle] = useState(null);
  const [pendingVocabDeck, setPendingVocabDeck] = useState(null);

  const handleNavigateToLibrary = (articleId) => {
    setPendingLibraryArticle(articleId);
    setActiveTab('library');
  };

  const handleNavigateToVocabDeck = (deckId) => {
    setPendingVocabDeck(deckId);
    setActiveTab('library');
  };
  const completeOnboarding = () => {
    localStorage.setItem('vnme_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
    // Tutorial will auto-start for new users (hasCompletedTutorial stays false)
  };

  const completeTutorial = () => {
    localStorage.setItem('vnme_tutorial_completed', 'true');
    setHasCompletedTutorial(true);
  };

  if (!hasCompletedOnboarding) {
    return (
      <div className="mobile-app-wrapper">
        <OnboardingFlow onComplete={completeOnboarding} />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab onSearchWord={handleDictInput} />;
      case 'study': return <RoadmapTab onNavigateToVocabDeck={handleNavigateToVocabDeck} />;
      case 'dictionary': return <DictionaryTab pendingInput={pendingDictInput} clearPendingInput={() => setPendingDictInput(null)} onNavigateToLibrary={handleNavigateToLibrary} />;
      case 'library': return <ReadingLibraryTab onSubtitleChange={setTabSubtitle} onSearchWord={handleDictInput} pendingArticle={pendingLibraryArticle} clearPendingArticle={() => setPendingLibraryArticle(null)} pendingVocabDeck={pendingVocabDeck} clearPendingVocabDeck={() => setPendingVocabDeck(null)} />;
      case 'scenes': return <ScenesTab />;
      case 'practice': return <PracticeTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="app-container">
        <div className="content-column">
          <div className={activeTab !== 'home' ? 'topbar-desktop-only' : ''}>
            <TopBar activeTab={activeTab} subtitleOverride={tabSubtitle} />
          </div>
          <main key={activeTab} className={`main-content${activeTab !== 'home' ? ' no-topbar' : ''}`}>{renderTab()}</main>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        {!hasCompletedTutorial && (
          <AppTutorial
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onComplete={completeTutorial}
          />
        )}
        <NotificationToastStack />
        <NotificationPanel />
        <InstallPrompt />
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <DongProvider>
        <UserProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<StudentApp />} />
                <Route path="/practice" element={<StudentApp initialTab="library" />} />
                <Route path="/lesson/:lessonId" element={<div className="mobile-app-wrapper"><LessonGame /></div>} />
                <Route path="/scene/:sceneId" element={<div className="mobile-app-wrapper"><SceneEngine /></div>} />
                <Route path="/grammar-lesson/:nodeId" element={<div className="mobile-app-wrapper"><GrammarLesson /></div>} />
                <Route path="/test/:nodeId" element={<div className="mobile-app-wrapper"><UnitTest /></div>} />
                {/* Full-screen Practice Routes */}
                {/* Tone Listen sub-modules */}
                <Route path="/practice/tones" element={<Navigate to="/practice/tones-1" replace />} />
                <Route path="/practice/tones-1" element={<div className="mobile-app-wrapper"><TonePractice1 /></div>} />
                <Route path="/practice/tones-2" element={<div className="mobile-app-wrapper"><TonePractice2 /></div>} />
                <Route path="/practice/tones-3" element={<div className="mobile-app-wrapper"><TonePractice3 /></div>} />
                <Route path="/practice/tones-4" element={<div className="mobile-app-wrapper"><TonePractice4 /></div>} />
                {/* Pitch Training sub-modules */}
                <Route path="/practice/pitch" element={<Navigate to="/practice/pitch-1" replace />} />
                <Route path="/practice/pitch-1" element={<div className="mobile-app-wrapper"><TonePitchTraining1 /></div>} />
                <Route path="/practice/pitch-2" element={<div className="mobile-app-wrapper"><TonePitchTraining2 /></div>} />
                {/* Tone Marks sub-modules */}
                <Route path="/practice/tonemarks" element={<Navigate to="/practice/tonemarks-basic" replace />} />
                <Route path="/practice/tonemarks-basic" element={<div className="mobile-app-wrapper"><ToneMarksBasic /></div>} />
                <Route path="/practice/tonemarks-special" element={<div className="mobile-app-wrapper"><ToneMarksSpecial /></div>} />
                <Route path="/practice/tonemarks-master" element={<div className="mobile-app-wrapper"><ToneMarksMaster /></div>} />
                {/* Vowels sub-modules */}
                <Route path="/practice/vowels" element={<Navigate to="/practice/vowels-single-1" replace />} />
                <Route path="/practice/vowels-single-1" element={<div className="mobile-app-wrapper"><VowelsSingle1 /></div>} />
                <Route path="/practice/vowels-single-2" element={<div className="mobile-app-wrapper"><VowelsSingle2 /></div>} />
                <Route path="/practice/vowels-diph-1" element={<div className="mobile-app-wrapper"><VowelsDiph1 /></div>} />
                <Route path="/practice/vowels-diph-2" element={<div className="mobile-app-wrapper"><VowelsDiph2 /></div>} />
                <Route path="/practice/vowels-diph-3" element={<div className="mobile-app-wrapper"><VowelsDiph3 /></div>} />
                {/* Numbers sub-modules */}
                <Route path="/practice/numbers" element={<Navigate to="/practice/numbers-1" replace />} />
                <Route path="/practice/numbers-1" element={<div className="mobile-app-wrapper"><NumbersPractice1 /></div>} />
                <Route path="/practice/numbers-2" element={<div className="mobile-app-wrapper"><NumbersPractice2 /></div>} />
                <Route path="/practice/numbers-3" element={<div className="mobile-app-wrapper"><NumbersPractice3 /></div>} />
                {/* Other practice */}
                {/* Pronouns sub-modules */}
                <Route path="/practice/kinship-foundation" element={<div className="mobile-app-wrapper"><KinshipFoundation /></div>} />
                <Route path="/practice/pronouns" element={<Navigate to="/practice/pronouns-1" replace />} />
                <Route path="/practice/pronouns-1" element={<div className="mobile-app-wrapper"><Pronouns1 /></div>} />
                <Route path="/practice/pronouns-2" element={<div className="mobile-app-wrapper"><Pronouns2 /></div>} />
                <Route path="/practice/kinship-calculator" element={<div className="mobile-app-wrapper"><KinshipCalculator /></div>} />
                <Route path="/practice/kinship-engine" element={<div className="mobile-app-wrapper"><KinshipEngine /></div>} />
                {/* TELEX sub-modules */}
                <Route path="/practice/telex" element={<Navigate to="/practice/telex-1" replace />} />
                <Route path="/practice/telex-1" element={<div className="mobile-app-wrapper"><TelexTyping1 /></div>} />
                <Route path="/practice/telex-2" element={<div className="mobile-app-wrapper"><TelexTyping2 /></div>} />
                <Route path="/practice/telex-3" element={<div className="mobile-app-wrapper"><TelexTyping3 /></div>} />
                {/* Teen Code sub-modules */}
                <Route path="/practice/teencode" element={<Navigate to="/practice/teencode-1" replace />} />
                <Route path="/practice/teencode-1" element={<div className="mobile-app-wrapper"><TeenCode1 /></div>} />
                <Route path="/practice/teencode-2" element={<div className="mobile-app-wrapper"><TeenCode2 /></div>} />
                <Route path="/practice/teencode-3" element={<div className="mobile-app-wrapper"><TeenCode3 /></div>} />
                {/* Drill-based practice modules */}
                <Route path="/practice/consonants" element={<div className="mobile-app-wrapper"><ConsonantsPractice /></div>} />
                <Route path="/practice/classifiers-1" element={<div className="mobile-app-wrapper"><ClassifiersBasics /></div>} />
                <Route path="/practice/classifiers-2" element={<div className="mobile-app-wrapper"><ClassifiersExtended /></div>} />
                <Route path="/practice/particles-1" element={<div className="mobile-app-wrapper"><ParticlesPoliteness /></div>} />
                <Route path="/practice/particles-2" element={<div className="mobile-app-wrapper"><ParticlesEmotion /></div>} />
                <Route path="/practice/question-words-1" element={<div className="mobile-app-wrapper"><QuestionWords /></div>} />
                <Route path="/practice/question-words-2" element={<div className="mobile-app-wrapper"><QuestionWordsAdvanced /></div>} />
                <Route path="/practice/aspect-markers" element={<div className="mobile-app-wrapper"><AspectMarkers /></div>} />
                {/* Grammar drill modules (Units 26-30 + prepositions) */}
                <Route path="/practice/connectors" element={<div className="mobile-app-wrapper"><Connectors /></div>} />
                <Route path="/practice/intensifiers" element={<div className="mobile-app-wrapper"><Intensifiers /></div>} />
                <Route path="/practice/degree-adverbs" element={<div className="mobile-app-wrapper"><DegreeAdverbs /></div>} />
                <Route path="/practice/quantifiers" element={<div className="mobile-app-wrapper"><Quantifiers /></div>} />
                <Route path="/practice/vision-verbs" element={<div className="mobile-app-wrapper"><VisionVerbs /></div>} />
                <Route path="/practice/prepositions" element={<div className="mobile-app-wrapper"><Prepositions /></div>} />
                <Route path="/practice/flashcards" element={<Navigate to="/practice" replace />} />

                {/* Legal Routes */}
                <Route path="/privacy" element={<div className="mobile-app-wrapper"><PrivacyPolicy /></div>} />
                <Route path="/terms" element={<div className="mobile-app-wrapper"><TermsOfService /></div>} />

                {/* Grammar Routes */}
                <Route path="/grammar/:level" element={<div className="mobile-app-wrapper"><GrammarList /></div>} />
                <Route path="/grammar/:level/:index" element={<div className="mobile-app-wrapper"><GrammarDetail /></div>} />

                {/* Admin CMS Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="mapper" />} />
                  <Route path="mapper" element={<RoadmapMapper />} />
                  <Route path="lesson" element={<LessonBuilder />} />
                  <Route path="grammar" element={<GrammarEditor />} />
                  <Route path="articles" element={<ArticleEditor />} />
                  <Route path="vocab" element={<VocabEditor />} />
                  <Route path="tones" element={<ToneWordEditor />} />
                  <Route path="kinship" element={<KinshipEditor />} />
                  <Route path="drills" element={<DrillEditor />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </UserProvider>
      </DongProvider>
    </LanguageProvider>
  );
}

export default App;
