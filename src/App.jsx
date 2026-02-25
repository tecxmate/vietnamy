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
import RoadmapTab from './components/Tabs/RoadmapTab';
import PracticeTab from './components/Tabs/PracticeTab';
import DictionaryTab from './components/Tabs/DictionaryTab';
import GrammarTab from './components/Tabs/GrammarTab';
import ReadingLibraryTab from './components/Tabs/ReadingLibraryTab';
import FlashcardsPage from './pages/Practice/FlashcardsPage';
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
import RewardToast from './components/RewardToast';
// Practice Modules
import TonePractice from './pages/Practice/TonePractice';
import PronounsPractice from './pages/Practice/PronounsPractice';
import NumbersPractice from './pages/Practice/NumbersPractice';
import ToneMarks from './pages/Practice/ToneMarks';
import VowelsPractice from './pages/Practice/VowelsPractice';
import VocabPractice from './pages/Practice/VocabPractice';
import TonePitchTraining from './pages/Practice/TonePitchTraining';
import TelexTyping from './pages/Practice/TelexTyping';

function StudentApp({ initialTab = 'roadmap' }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('vnme_onboarding_completed') === 'true';
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabSubtitle, setTabSubtitle] = useState(null);
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
      case 'roadmap': return <RoadmapTab />;
      case 'practice': return <PracticeTab />;
      case 'dictionary': return <DictionaryTab />;
      case 'grammar': return <GrammarTab />;
      case 'library': return <ReadingLibraryTab onSubtitleChange={setTabSubtitle} />;
      case 'community': return <CommunityTab />;
      default: return <RoadmapTab />;
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="app-container">
        <TopBar activeTab={activeTab} subtitleOverride={tabSubtitle} />
        <main key={activeTab} className="main-content">{renderTab()}</main>
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
            <RewardToast />
            <Routes>
              <Route path="/" element={<StudentApp />} />
              <Route path="/practice" element={<StudentApp initialTab="practice" />} />
              <Route path="/lesson/:lessonId" element={<div className="mobile-app-wrapper"><LessonGame /></div>} />
              {/* Full-screen Practice Routes */}
              <Route path="/practice/tones" element={<div className="mobile-app-wrapper"><TonePractice /></div>} />
              <Route path="/practice/pronouns" element={<div className="mobile-app-wrapper"><PronounsPractice /></div>} />
              <Route path="/practice/numbers" element={<div className="mobile-app-wrapper"><NumbersPractice /></div>} />
              <Route path="/practice/tonemarks" element={<div className="mobile-app-wrapper"><ToneMarks /></div>} />
              <Route path="/practice/vowels" element={<div className="mobile-app-wrapper"><VowelsPractice /></div>} />
              <Route path="/practice/vocab" element={<Navigate to="/practice/flashcards" replace />} />
              <Route path="/practice/flashcards" element={<div className="mobile-app-wrapper"><FlashcardsPage /></div>} />
              <Route path="/practice/pitch" element={<div className="mobile-app-wrapper"><TonePitchTraining /></div>} />
              <Route path="/practice/telex" element={<div className="mobile-app-wrapper"><TelexTyping /></div>} />

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
