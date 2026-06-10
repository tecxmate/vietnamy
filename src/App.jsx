import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Contexts
import { LanguageProvider } from './context/LanguageContext';
import { ProgressProvider } from './context/ProgressContext';
import { UserProvider, useUser } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isAdminAuthenticated } from './lib/adminAuth';

// Tabs & Layout
import BottomNav from './components/BottomNav';
import { NotificationToastStack, NotificationPanel } from './components/NotificationToast';
import TopBar from './components/TopBar';
import MobileAccountBar from './components/MobileAccountBar';
import InstallPrompt from './components/InstallPrompt';
import { installGlobalHaptics } from './utils/haptics';
import { preloadUISounds } from './utils/sound';
import { trackPushReturnFromUrl } from './utils/pushNotifications';

const loadRoadmapTab = () => import('./components/Tabs/RoadmapTab');
const loadDictionaryTab = () => import('./components/Tabs/DictionaryTab');
const loadReadingLibraryTab = () => import('./components/Tabs/ReadingLibraryTab');

const TAB_LOADERS = {
  study: loadRoadmapTab,
  dictionary: loadDictionaryTab,
  library: loadReadingLibraryTab,
};

const preloadedTabs = new Set();

function canBackgroundPreload() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  return connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g';
}

function preloadTab(tab) {
  const loader = TAB_LOADERS[tab];
  if (!loader || preloadedTabs.has(tab)) return;
  preloadedTabs.add(tab);
  loader().catch(() => {
    preloadedTabs.delete(tab);
  });
}

function preloadStudentTabs(activeTab) {
  if (!canBackgroundPreload()) return () => {};

  const tabs = VALID_TABS.filter(tab => tab !== activeTab);
  const timers = [];
  let idleId = null;

  const start = () => {
    tabs.forEach((tab, index) => {
      timers.push(window.setTimeout(() => preloadTab(tab), index * 250));
    });
  };

  if ('requestIdleCallback' in window) {
    idleId = window.requestIdleCallback(start, { timeout: 1800 });
  } else {
    timers.push(window.setTimeout(start, 1200));
  }

  return () => {
    if (idleId !== null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    }
    timers.forEach(timer => window.clearTimeout(timer));
  };
}

const OnboardingFlow = lazy(() => import('./components/Onboarding/OnboardingFlow'));
const AppTutorial = lazy(() => import('./components/Onboarding/AppTutorial'));
const RoadmapTab = lazy(loadRoadmapTab);
const DictionaryTab = lazy(loadDictionaryTab);
const ReadingLibraryTab = lazy(loadReadingLibraryTab);

const GrammarIndex = lazy(() => import('./pages/Grammar/GrammarIndex'));
const GrammarList = lazy(() => import('./pages/Grammar/GrammarList'));

const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const RoadmapMapper = lazy(() => import('./pages/Admin/RoadmapMapper'));
const LessonBuilder = lazy(() => import('./pages/Admin/LessonBuilder'));
const GrammarUnitEditor = lazy(() => import('./pages/Admin/GrammarUnitEditor'));
const AlphabetEditor = lazy(() => import('./pages/Admin/AlphabetEditor'));
const VowelsEditor = lazy(() => import('./pages/Admin/VowelsEditor'));
const ArticleEditor = lazy(() => import('./pages/Admin/ArticleEditor'));
const VocabEditor = lazy(() => import('./pages/Admin/VocabEditor'));
const ToneWordEditor = lazy(() => import('./pages/Admin/ToneWordEditor'));
const KinshipEditor = lazy(() => import('./pages/Admin/KinshipEditor'));
const DrillEditor = lazy(() => import('./pages/Admin/DrillEditor'));
const ConceptEditor = lazy(() => import('./pages/Admin/ConceptEditor'));
const MascotEditor = lazy(() => import('./pages/Admin/MascotEditor'));

const LessonGame = lazy(() => import('./components/LessonGame'));
const SceneEngine = lazy(() => import('./components/Scene/SceneEngine'));
const GrammarUnitLesson = lazy(() => import('./pages/GrammarUnitLesson'));
const UnitTest = lazy(() => import('./pages/UnitTest'));
const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/Legal/TermsOfService'));

const KinshipFoundation = lazy(() => import('./pages/Practice/KinshipFoundation'));
const Pronouns1 = lazy(() => import('./pages/Practice/Pronouns1'));
const Pronouns2 = lazy(() => import('./pages/Practice/Pronouns2'));
const KinshipEngine = lazy(() => import('./pages/Practice/KinshipEngine'));
const KinshipCalculator = lazy(() => import('./pages/Practice/KinshipCalculator'));
const TelexTyping1 = lazy(() => import('./pages/Practice/TelexTyping1'));
const TelexTyping2 = lazy(() => import('./pages/Practice/TelexTyping2'));
const TelexTyping3 = lazy(() => import('./pages/Practice/TelexTyping3'));
const TeenCode1 = lazy(() => import('./pages/Practice/TeenCode1'));
const TeenCode2 = lazy(() => import('./pages/Practice/TeenCode2'));
const TeenCode3 = lazy(() => import('./pages/Practice/TeenCode3'));
const ToneMarksBasic = lazy(() => import('./pages/Practice/ToneMarksBasic'));
const ToneMarksSpecial = lazy(() => import('./pages/Practice/ToneMarksSpecial'));
const ToneMarksMaster = lazy(() => import('./pages/Practice/ToneMarksMaster'));
const ToneNodeLesson = lazy(() => import('./pages/Practice/ToneNodeLesson'));
const AlphabetLesson = lazy(() => import('./pages/Practice/AlphabetLesson'));
const VowelsSingle1 = lazy(() => import('./pages/Practice/VowelsSingle1'));
const VowelsSingle2 = lazy(() => import('./pages/Practice/VowelsSingle2'));
const VowelsDiph1 = lazy(() => import('./pages/Practice/VowelsDiph1'));
const VowelsDiph2 = lazy(() => import('./pages/Practice/VowelsDiph2'));
const VowelsDiph3 = lazy(() => import('./pages/Practice/VowelsDiph3'));
const NumbersPractice1 = lazy(() => import('./pages/Practice/NumbersPractice1'));
const NumbersPractice2 = lazy(() => import('./pages/Practice/NumbersPractice2'));
const NumbersPractice3 = lazy(() => import('./pages/Practice/NumbersPractice3'));
const ConsonantsPractice = lazy(() => import('./pages/Practice/ConsonantsPractice'));
const ConsonantsFinalPractice = lazy(() => import('./pages/Practice/ConsonantsFinalPractice'));
const ClassifiersBasics = lazy(() => import('./pages/Practice/ClassifiersBasics'));
const ClassifiersExtended = lazy(() => import('./pages/Practice/ClassifiersExtended'));
const ParticlesPoliteness = lazy(() => import('./pages/Practice/ParticlesPoliteness'));
const ParticlesEmotion = lazy(() => import('./pages/Practice/ParticlesEmotion'));
const QuestionWords = lazy(() => import('./pages/Practice/QuestionWords'));
const QuestionWordsAdvanced = lazy(() => import('./pages/Practice/QuestionWordsAdvanced'));
const AspectMarkers = lazy(() => import('./pages/Practice/AspectMarkers'));
const Connectors = lazy(() => import('./pages/Practice/Connectors'));
const Intensifiers = lazy(() => import('./pages/Practice/Intensifiers'));
const DegreeAdverbs = lazy(() => import('./pages/Practice/DegreeAdverbs'));
const Quantifiers = lazy(() => import('./pages/Practice/Quantifiers'));
const VisionVerbs = lazy(() => import('./pages/Practice/VisionVerbs'));
const Prepositions = lazy(() => import('./pages/Practice/Prepositions'));

// One app, three tabs. Pronunciation and grammar are integrated into Study
// (the roadmap modules), so they are no longer separate nav tabs.
const VALID_TABS = ['study', 'dictionary', 'library'];

function normalizeTab(tab, fallback = 'study') {
  return VALID_TABS.includes(tab) ? tab : fallback;
}

function LoadingScreen() {
  return (
    <div className="mobile-app-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>Loading...</span>
      </div>
    </div>
  );
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Route render failed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mobile-app-wrapper">
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 14,
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-main)',
          textAlign: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Something went wrong.</h2>
          <p style={{ margin: 0, maxWidth: 340, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            The app hit a navigation problem. Return home and try again.
          </p>
          <button className="primary" onClick={() => { window.location.href = '/'; }}>
            Return Home
          </button>
        </div>
      </div>
    );
  }
}

function AdminRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <AdminLayout />;
}

function StudentApp({ initialTab = 'study' }) {
  const location = useLocation();
  const initialTabSafe = normalizeTab(initialTab);
  const tabStorageKey = 'vnme_active_tab';
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('vnme_onboarding_completed') === 'true';
  });
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem('vnme_tutorial_completed') === 'true';
  });
  const [activeTab, setActiveTab] = useState(() => {
    // location.state.tab (deep link) > explicit route tab > saved > default (study).
    const fromState = location.state?.tab ? normalizeTab(location.state.tab, initialTabSafe) : null;
    if (fromState) return fromState;
    if (initialTabSafe !== 'study') return initialTabSafe;
    const saved = localStorage.getItem(tabStorageKey);
    return VALID_TABS.includes(saved) ? saved : initialTabSafe;
  });

  // Deep-link via location.state.tab; persist the active tab.
  React.useEffect(() => {
    if (location.state?.tab) setActiveTab(normalizeTab(location.state.tab, initialTabSafe));
  }, [location.state?.tab, initialTabSafe]);
  React.useEffect(() => {
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab]);
  const [tabSubtitle, setTabSubtitle] = useState(null);
  const [pendingDictInput, setPendingDictInput] = useState(null);
  const { updateUserProfile } = useUser();
  const { user, loading: authLoading } = useAuth();

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

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  React.useEffect(() => {
    if (authLoading || !hasCompletedOnboarding || (!user && !isLocalhost)) return undefined;
    return preloadStudentTabs(activeTab);
  }, [activeTab, authLoading, hasCompletedOnboarding, isLocalhost, user]);

  React.useEffect(() => {
    if (authLoading) return;
    trackPushReturnFromUrl(user?.id);
  }, [authLoading, user?.id]);

  const completeOnboarding = () => {
    localStorage.setItem('vnme_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
    // Tutorial will auto-start for new users (hasCompletedTutorial stays false)
  };

  const completeTutorial = () => {
    localStorage.setItem('vnme_tutorial_completed', 'true');
    setHasCompletedTutorial(true);
  };

  // Show loading while checking auth state
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Must sign in before using the app (skip on localhost for dev)
  if (!user && !isLocalhost) {
    return (
      <div className="mobile-app-wrapper">
        <OnboardingFlow onComplete={completeOnboarding} requireAuth />
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <div className="mobile-app-wrapper">
        <OnboardingFlow onComplete={completeOnboarding} />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'study': return <RoadmapTab onNavigateToVocabDeck={handleNavigateToVocabDeck} />;
      case 'dictionary': return <DictionaryTab pendingInput={pendingDictInput} clearPendingInput={() => setPendingDictInput(null)} onNavigateToLibrary={handleNavigateToLibrary} />;
      case 'library': return <ReadingLibraryTab onSubtitleChange={setTabSubtitle} onSearchWord={handleDictInput} pendingArticle={pendingLibraryArticle} clearPendingArticle={() => setPendingLibraryArticle(null)} pendingVocabDeck={pendingVocabDeck} clearPendingVocabDeck={() => setPendingVocabDeck(null)} />;
      default: return <RoadmapTab onNavigateToVocabDeck={handleNavigateToVocabDeck} />;
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="app-container">
        <div className={`content-column ${activeTab}-tab-container`}>
          {activeTab !== 'study' && <MobileAccountBar />}
          <div className="topbar-desktop-only">
            <TopBar activeTab={activeTab} subtitleOverride={tabSubtitle} />
          </div>
          <main key={activeTab} className={`main-content ${activeTab}-tab no-topbar`}>{renderTab()}</main>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onPreloadTab={preloadTab} tabs={VALID_TABS} />
        {!hasCompletedTutorial && (
          <AppTutorial
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onComplete={completeTutorial}
            allowedTabs={VALID_TABS}
          />
        )}
        <NotificationToastStack />
        <NotificationPanel />
        <InstallPrompt />
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <RouteErrorBoundary key={location.key}>
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<StudentApp />} />
        {/* Backward-compat: the old two-shell URLs now collapse into the single app. */}
        <Route path="/learn/*" element={<Navigate to="/" replace />} />
        <Route path="/dictionary/*" element={<Navigate to="/" replace state={{ tab: 'dictionary' }} />} />
        <Route path="/practice" element={<StudentApp initialTab="library" />} />
        <Route path="/lesson/:lessonId" element={<div className="mobile-app-wrapper"><LessonGame /></div>} />
        <Route path="/scene/:sceneId" element={<div className="mobile-app-wrapper"><SceneEngine /></div>} />
        <Route path="/grammar-unit/:unitId" element={<div className="mobile-app-wrapper"><GrammarUnitLesson /></div>} />
        <Route path="/test/:nodeId" element={<div className="mobile-app-wrapper"><UnitTest /></div>} />
        {/* Full-screen Practice Routes */}
        {/* Backward-compat: old tone URLs now enter the roadmap-backed tone lessons. */}
        <Route path="/practice/tones" element={<Navigate to="/practice/tones/level1" replace />} />
        <Route path="/practice/tone-trainer" element={<Navigate to="/practice/tones/speak" replace />} />
        {/* Tone Marks sub-modules */}
        <Route path="/practice/tonemarks" element={<Navigate to="/practice/tonemarks-basic" replace />} />
        <Route path="/practice/tonemarks-basic" element={<div className="mobile-app-wrapper"><ToneMarksBasic /></div>} />
        <Route path="/practice/tonemarks-special" element={<div className="mobile-app-wrapper"><ToneMarksSpecial /></div>} />
        <Route path="/practice/tonemarks-master" element={<div className="mobile-app-wrapper"><ToneMarksMaster /></div>} />
        <Route path="/practice/tones/:level" element={<div className="mobile-app-wrapper"><ToneNodeLesson /></div>} />
        <Route path="/practice/alphabet" element={<div className="mobile-app-wrapper"><AlphabetLesson /></div>} />
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
        <Route path="/practice/consonants-final" element={<div className="mobile-app-wrapper"><ConsonantsFinalPractice /></div>} />
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
        <Route path="/grammar" element={<div className="mobile-app-wrapper"><GrammarIndex /></div>} />
        <Route path="/grammar/:level" element={<div className="mobile-app-wrapper"><GrammarList /></div>} />

        {/* Admin CMS Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<Navigate to="mapper" />} />
          <Route path="mapper" element={<RoadmapMapper />} />
          <Route path="lesson" element={<LessonBuilder />} />
          <Route path="concepts" element={<ConceptEditor />} />
          <Route path="grammar-unit" element={<GrammarUnitEditor />} />
          <Route path="alphabet" element={<AlphabetEditor />} />
          <Route path="vowels" element={<VowelsEditor />} />
          <Route path="articles" element={<ArticleEditor />} />
          <Route path="vocab" element={<VocabEditor />} />
          <Route path="tones" element={<ToneWordEditor />} />
          <Route path="kinship" element={<KinshipEditor />} />
          <Route path="drills" element={<DrillEditor />} />
          <Route path="mascot" element={<MascotEditor />} />
        </Route>

        {/* Catch-all: redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

function App() {
  React.useEffect(() => {
    const uninstallHaptics = installGlobalHaptics();
    const timer = window.setTimeout(preloadUISounds, 800);
    return () => {
      uninstallHaptics?.();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <AuthProvider>
    <LanguageProvider>
      <ProgressProvider>
        <UserProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </NotificationProvider>
        </UserProvider>
      </ProgressProvider>
    </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
