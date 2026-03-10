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
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';
// Practice Modules
import TonePractice from './pages/Practice/TonePractice';
import PronounsPractice from './pages/Practice/PronounsPractice';
import NumbersPractice from './pages/Practice/NumbersPractice';
import ToneMarksBasic from './pages/Practice/ToneMarksBasic';
import ToneMarksSpecial from './pages/Practice/ToneMarksSpecial';
import ToneMarksMaster from './pages/Practice/ToneMarksMaster';
import VowelsPractice from './pages/Practice/VowelsPractice';
import VocabPractice from './pages/Practice/VocabPractice';
import TonePitchTraining from './pages/Practice/TonePitchTraining';
import TelexTyping from './pages/Practice/TelexTyping';
import TeenCode from './pages/Practice/TeenCode';

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

  const handleNavigateToLibrary = (articleId) => {
    setPendingLibraryArticle(articleId);
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
      case 'study': return <RoadmapTab />;
      case 'dictionary': return <DictionaryTab pendingInput={pendingDictInput} clearPendingInput={() => setPendingDictInput(null)} onNavigateToLibrary={handleNavigateToLibrary} />;
      case 'library': return <ReadingLibraryTab onSubtitleChange={setTabSubtitle} onSearchWord={handleDictInput} pendingArticle={pendingLibraryArticle} clearPendingArticle={() => setPendingLibraryArticle(null)} />;
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
        {!hasCompletedTutorial && (
          <AppTutorial
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onComplete={completeTutorial}
          />
        )}
        <NotificationToastStack />
        <NotificationPanel />
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
                <Route path="/grammar-lesson/:nodeId" element={<div className="mobile-app-wrapper"><GrammarLesson /></div>} />
                <Route path="/test/:nodeId" element={<div className="mobile-app-wrapper"><UnitTest /></div>} />
                {/* Full-screen Practice Routes */}
                <Route path="/practice/tones" element={<div className="mobile-app-wrapper"><TonePractice /></div>} />
                <Route path="/practice/pronouns" element={<div className="mobile-app-wrapper"><PronounsPractice /></div>} />
                <Route path="/practice/numbers" element={<div className="mobile-app-wrapper"><NumbersPractice /></div>} />
                <Route path="/practice/tonemarks" element={<Navigate to="/practice/tonemarks-basic" replace />} />
                <Route path="/practice/tonemarks-basic" element={<div className="mobile-app-wrapper"><ToneMarksBasic /></div>} />
                <Route path="/practice/tonemarks-special" element={<div className="mobile-app-wrapper"><ToneMarksSpecial /></div>} />
                <Route path="/practice/tonemarks-master" element={<div className="mobile-app-wrapper"><ToneMarksMaster /></div>} />
                <Route path="/practice/vowels" element={<div className="mobile-app-wrapper"><VowelsPractice /></div>} />
                <Route path="/practice/vocab" element={<Navigate to="/practice" replace />} />
                <Route path="/practice/flashcards" element={<Navigate to="/practice" replace />} />
                <Route path="/practice/pitch" element={<div className="mobile-app-wrapper"><TonePitchTraining /></div>} />
                <Route path="/practice/telex" element={<div className="mobile-app-wrapper"><TelexTyping /></div>} />
                <Route path="/practice/teencode" element={<div className="mobile-app-wrapper"><TeenCode /></div>} />

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
