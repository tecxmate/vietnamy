import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Contexts
import { LanguageProvider } from './context/LanguageContext';
import { DongProvider } from './context/DongContext';
import { UserProvider } from './context/UserContext';

// Tabs & Layout
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import HomeTab from './components/Tabs/HomeTab';
import RoadmapTab from './components/Tabs/RoadmapTab';
import DictionaryTab from './components/Tabs/DictionaryTab';
import ReadingLibraryTab from './components/Tabs/ReadingLibraryTab';
// FlashcardsPage merged into Library > Vocabulary
import CommunityTab from './components/Tabs/CommunityTab';

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

// Main Content
import LessonGame from './components/LessonGame';
import GrammarLesson from './pages/GrammarLesson';
import UnitTest from './pages/UnitTest';
// Practice Modules
import TonePractice from './pages/Practice/TonePractice';
import PronounsPractice from './pages/Practice/PronounsPractice';
import NumbersPractice from './pages/Practice/NumbersPractice';
import ToneMarks from './pages/Practice/ToneMarks';
import VowelsPractice from './pages/Practice/VowelsPractice';
import VocabPractice from './pages/Practice/VocabPractice';
import TonePitchTraining from './pages/Practice/TonePitchTraining';
import TelexTyping from './pages/Practice/TelexTyping';
import TeenCode from './pages/Practice/TeenCode';

function StudentApp({ initialTab = 'home' }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('vnme_onboarding_completed') === 'true';
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabSubtitle, setTabSubtitle] = useState(null);
  const [pendingDictInput, setPendingDictInput] = useState(null);

  const handleDictInput = (text) => {
    setPendingDictInput(text);
    setActiveTab('dictionary');
  };
  const completeOnboarding = () => {
    localStorage.setItem('vnme_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
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
      case 'study': return <RoadmapTab />;
      case 'dictionary': return <DictionaryTab pendingInput={pendingDictInput} clearPendingInput={() => setPendingDictInput(null)} />;
      case 'library': return <ReadingLibraryTab onSubtitleChange={setTabSubtitle} onSearchWord={handleDictInput} />;
      case 'community': return <CommunityTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="app-container">
        {activeTab === 'home' && <TopBar activeTab={activeTab} subtitleOverride={tabSubtitle} />}
        <main key={activeTab} className={`main-content${activeTab !== 'home' ? ' no-topbar' : ''}`}>{renderTab()}</main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <DongProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<StudentApp />} />
              <Route path="/practice" element={<StudentApp initialTab="library" />} />
              <Route path="/lesson/:lessonId" element={<div className="mobile-app-wrapper"><LessonGame /></div>} />
              <Route path="/grammar-lesson/:nodeId" element={<div className="mobile-app-wrapper"><GrammarLesson /></div>} />
              <Route path="/test/:nodeId" element={<div className="mobile-app-wrapper"><UnitTest /></div>} />
              {/* Full-screen Practice Routes */}
              <Route path="/practice/tones" element={<div className="mobile-app-wrapper"><TonePractice /></div>} />
              <Route path="/practice/pronouns" element={<div className="mobile-app-wrapper"><PronounsPractice /></div>} />
              <Route path="/practice/numbers" element={<div className="mobile-app-wrapper"><NumbersPractice /></div>} />
              <Route path="/practice/tonemarks" element={<div className="mobile-app-wrapper"><ToneMarks /></div>} />
              <Route path="/practice/vowels" element={<div className="mobile-app-wrapper"><VowelsPractice /></div>} />
              <Route path="/practice/vocab" element={<Navigate to="/practice" replace />} />
              <Route path="/practice/flashcards" element={<Navigate to="/practice" replace />} />
              <Route path="/practice/pitch" element={<div className="mobile-app-wrapper"><TonePitchTraining /></div>} />
              <Route path="/practice/telex" element={<div className="mobile-app-wrapper"><TelexTyping /></div>} />
              <Route path="/practice/teencode" element={<div className="mobile-app-wrapper"><TeenCode /></div>} />

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
              </Route>
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </DongProvider>
    </LanguageProvider>
  );
}

export default App;
