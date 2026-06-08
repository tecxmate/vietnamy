import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import InstallPrompt from './components/InstallPrompt';
import { installGlobalHaptics } from './utils/haptics';
import { preloadUISounds } from './utils/sound';

const loadHomeTab = () => import('./components/Tabs/HomeTab');
const loadRoadmapTab = () => import('./components/Tabs/RoadmapTab');
const loadGrammarTab = () => import('./components/Tabs/GrammarTab');
const loadSoundsTab = () => import('./components/Tabs/SoundsTab');
const loadDictionaryTab = () => import('./components/Tabs/DictionaryTab');
const loadReadingLibraryTab = () => import('./components/Tabs/ReadingLibraryTab');

const TAB_LOADERS = {
  home: loadHomeTab,
  study: loadRoadmapTab,
  grammar: loadGrammarTab,
  sounds: loadSoundsTab,
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

  const tabs = ['study', 'dictionary', 'library', 'grammar', 'sounds', 'home'].filter(tab => tab !== activeTab);
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

const HomeTab = lazy(loadHomeTab);
const ReferenceHomeTab = lazy(() => import('./components/Tabs/ReferenceHomeTab'));
const OnboardingFlow = lazy(() => import('./components/Onboarding/OnboardingFlow'));
const AppTutorial = lazy(() => import('./components/Onboarding/AppTutorial'));
const RoadmapTab = lazy(loadRoadmapTab);
const GrammarTab = lazy(loadGrammarTab);
const SoundsTab = lazy(loadSoundsTab);
const DictionaryTab = lazy(loadDictionaryTab);
const ReadingLibraryTab = lazy(loadReadingLibraryTab);

const GrammarList = lazy(() => import('./pages/Grammar/GrammarList'));
const GrammarDetail = lazy(() => import('./pages/Grammar/GrammarDetail'));

const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const RoadmapMapper = lazy(() => import('./pages/Admin/RoadmapMapper'));
const LessonBuilder = lazy(() => import('./pages/Admin/LessonBuilder'));
const GrammarEditor = lazy(() => import('./pages/Admin/GrammarEditor'));
const ArticleEditor = lazy(() => import('./pages/Admin/ArticleEditor'));
const VocabEditor = lazy(() => import('./pages/Admin/VocabEditor'));
const ToneWordEditor = lazy(() => import('./pages/Admin/ToneWordEditor'));
const KinshipEditor = lazy(() => import('./pages/Admin/KinshipEditor'));
const DrillEditor = lazy(() => import('./pages/Admin/DrillEditor'));
const ConceptEditor = lazy(() => import('./pages/Admin/ConceptEditor'));

const LessonGame = lazy(() => import('./components/LessonGame'));
const SceneEngine = lazy(() => import('./components/Scene/SceneEngine'));
const GrammarLesson = lazy(() => import('./pages/GrammarLesson'));
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

const VALID_TABS = ['home', 'dicthome', 'study', 'grammar', 'sounds', 'dictionary', 'library'];

// Two product experiences sharing one codebase + account. A shell filters the
// bottom nav to its own tabs and sets the landing tab. `/` stays legacy
// (all tabs) until we flip the default; /learn and /dictionary are the shells.
const SHELLS = {
  // Learn is Duolingo-style: no home screen, the roadmap is everything.
  learn: { tabs: ['study'], default: 'study', label: 'Learn' },
  // The Home dashboard lives on the Dictionary (reference) side.
  dictionary: { tabs: ['home', 'dictionary', 'library', 'sounds', 'grammar'], default: 'home', label: 'Dictionary' },
};
const SHELL_KEY = 'vnme_active_shell';

// URL for a tab within a shell. The shell's default tab lives at the bare
// shell URL (/dictionary); other tabs get a segment (/dictionary/library).
function shellTabPath(shell, tab) {
  return tab === SHELLS[shell]?.default ? `/${shell}` : `/${shell}/${tab}`;
}

function normalizeTab(tab, fallback = 'home') {
  return VALID_TABS.includes(tab) ? tab : fallback;
}

// Segmented control to hop between the Learn and Dictionary experiences.
function ShellSwitcher({ current, variant = 'mobile' }) {
  const navigate = useNavigate();
  const go = (shell) => {
    try { localStorage.setItem(SHELL_KEY, shell); } catch { /* ignore */ }
    navigate(`/${shell}`);
  };
  return (
    <div className={`shell-switcher shell-switcher--${variant}`}>
      <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 999, padding: 3, gap: 2 }}>
        {Object.entries(SHELLS).map(([key, cfg]) => {
          const active = current === key;
          return (
            <button
              key={key}
              onClick={() => !active && go(key)}
              aria-pressed={active}
              style={{
                border: 'none', cursor: active ? 'default' : 'pointer',
                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                backgroundColor: active ? 'var(--primary-color)' : 'transparent',
                color: active ? '#1A1A1A' : 'var(--text-muted)',
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
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

function StudentApp({ initialTab = 'home', shell = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const urlTab = shell ? (params['*'] || undefined) : undefined; // splat from /shell/*
  const shellConfig = shell ? SHELLS[shell] : null;
  const allowedTabs = shellConfig ? shellConfig.tabs : VALID_TABS;
  const initialTabSafe = shellConfig ? shellConfig.default : normalizeTab(initialTab);
  const tabStorageKey = shellConfig ? `vnme_active_tab_${shell}` : 'vnme_active_tab';
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('vnme_onboarding_completed') === 'true';
  });
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem('vnme_tutorial_completed') === 'true';
  });
  const [activeTab, setActiveTab] = useState(() => {
    // In a shell the URL (/shell/<tab>) is the source of truth for the tab.
    if (shellConfig) {
      return (urlTab && allowedTabs.includes(urlTab)) ? urlTab : shellConfig.default;
    }
    // Legacy (no shell): location.state > explicit route tab > localStorage.
    const fromState = location.state?.tab ? normalizeTab(location.state.tab, initialTabSafe) : null;
    if (fromState && allowedTabs.includes(fromState)) return fromState;
    if (initialTabSafe !== 'home') return initialTabSafe;
    const saved = localStorage.getItem(tabStorageKey);
    if (allowedTabs.includes(saved)) return saved;
    return initialTabSafe;
  });

  // ── Shell tab ↔ URL sync (URL is the source of truth in a shell) ──
  // URL → tab: react to address bar / back-forward / links.
  React.useEffect(() => {
    if (!shellConfig) return;
    const target = (urlTab && allowedTabs.includes(urlTab)) ? urlTab : shellConfig.default;
    setActiveTab(prev => (prev === target ? prev : target));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab, shell]);
  // tab → URL: reflect in-app tab switches (nav clicks, deep links) as URLs.
  const lastNavRef = React.useRef(null);
  React.useEffect(() => {
    if (!shellConfig) return;
    if (!allowedTabs.includes(activeTab)) return; // out-of-shell render: keep current URL
    const desired = shellTabPath(shell, activeTab);
    // Guard against a duplicate push to the same URL (e.g. an effect re-run before
    // location.pathname has settled), which would need two Back presses.
    if (location.pathname !== desired && lastNavRef.current !== desired) {
      lastNavRef.current = desired;
      navigate(desired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, shell]);

  // Legacy (no-shell) only: sync location.state.tab + persist tab to localStorage.
  React.useEffect(() => {
    if (shellConfig) return;
    if (location.state?.tab) {
      setActiveTab(normalizeTab(location.state.tab, initialTabSafe));
    }
  }, [location.state?.tab, initialTabSafe, shellConfig]);
  React.useEffect(() => {
    if (shellConfig) return;
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab, tabStorageKey, shellConfig]);

  // Remember which experience the user is in, so `/` can land there later.
  React.useEffect(() => {
    if (shell) {
      try { localStorage.setItem(SHELL_KEY, shell); } catch { /* ignore */ }
    }
  }, [shell]);
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
      case 'home': return <HomeTab onSearchWord={handleDictInput} />;
      case 'dicthome': return <ReferenceHomeTab onSearchWord={handleDictInput} onNavigateTab={setActiveTab} />;
      case 'study': return <RoadmapTab onNavigateToVocabDeck={handleNavigateToVocabDeck} />;
      case 'grammar': return <GrammarTab />;
      case 'sounds': return <SoundsTab />;
      case 'dictionary': return <DictionaryTab pendingInput={pendingDictInput} clearPendingInput={() => setPendingDictInput(null)} onNavigateToLibrary={handleNavigateToLibrary} />;
      case 'library': return <ReadingLibraryTab onSubtitleChange={setTabSubtitle} onSearchWord={handleDictInput} pendingArticle={pendingLibraryArticle} clearPendingArticle={() => setPendingLibraryArticle(null)} pendingVocabDeck={pendingVocabDeck} clearPendingVocabDeck={() => setPendingVocabDeck(null)} />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="app-container">
        <div className={`content-column ${activeTab}-tab-container`}>
          <div className={activeTab !== 'home' ? 'topbar-desktop-only' : ''}>
            <TopBar activeTab={activeTab} subtitleOverride={tabSubtitle} />
          </div>
          <main key={activeTab} className={`main-content ${activeTab}-tab ${activeTab !== 'home' ? ' no-topbar' : ''}`}>{renderTab()}</main>
        </div>
        {shellConfig && <ShellSwitcher current={shell} variant="mobile" />}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onPreloadTab={preloadTab} tabs={allowedTabs} switcher={shellConfig ? <ShellSwitcher current={shell} variant="sidebar" /> : null} />
        {!hasCompletedTutorial && (
          <AppTutorial
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onComplete={completeTutorial}
            allowedTabs={shellConfig ? allowedTabs : undefined}
          />
        )}
        <NotificationToastStack />
        <NotificationPanel />
        <InstallPrompt />
      </div>
    </div>
  );
}

// Default landing. New users keep the full onboarding + tutorial in the legacy
// all-tabs shell; returning users land in the experience they last used (or the
// shell that owns the tab a deep link is asking for, e.g. "back to roadmap").
function RootRedirect() {
  const location = useLocation();
  const onboarded = localStorage.getItem('vnme_onboarding_completed') === 'true';
  if (!onboarded) {
    // New users onboard inside the Learn shell (teacher-first), then get a
    // tutorial scoped to that shell — no more legacy all-tabs tour.
    return <Navigate to="/learn" replace state={location.state} />;
  }
  const requestedTab = location.state?.tab ? normalizeTab(location.state.tab) : null;
  let shell = requestedTab
    ? Object.keys(SHELLS).find(key => SHELLS[key].tabs.includes(requestedTab))
    : null;
  if (!shell) {
    const last = localStorage.getItem(SHELL_KEY);
    shell = SHELLS[last] ? last : 'learn';
  }
  const to = requestedTab ? shellTabPath(shell, requestedTab) : `/${shell}`;
  return <Navigate to={to} replace state={location.state} />;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <RouteErrorBoundary key={location.key}>
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/learn/*" element={<StudentApp shell="learn" />} />
        <Route path="/dictionary/*" element={<StudentApp shell="dictionary" />} />
        <Route path="/practice" element={<StudentApp initialTab="library" />} />
        <Route path="/lesson/:lessonId" element={<div className="mobile-app-wrapper"><LessonGame /></div>} />
        <Route path="/scene/:sceneId" element={<div className="mobile-app-wrapper"><SceneEngine /></div>} />
        <Route path="/grammar-lesson/:nodeId" element={<div className="mobile-app-wrapper"><GrammarLesson /></div>} />
        <Route path="/grammar-unit/:unitId" element={<div className="mobile-app-wrapper"><GrammarUnitLesson /></div>} />
        <Route path="/test/:nodeId" element={<div className="mobile-app-wrapper"><UnitTest /></div>} />
        {/* Full-screen Practice Routes */}
        {/* Tone listening, pitch & speaking now live in the Sounds tab tone lesson */}
        <Route path="/practice/tones" element={<Navigate to="/" replace state={{ tab: 'sounds', openToneLesson: true }} />} />
        <Route path="/practice/tone-trainer" element={<Navigate to="/" replace state={{ tab: 'sounds', openToneLesson: true }} />} />
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
        <Route path="/grammar/:level" element={<div className="mobile-app-wrapper"><GrammarList /></div>} />
        <Route path="/grammar/:level/:index" element={<div className="mobile-app-wrapper"><GrammarDetail /></div>} />

        {/* Admin CMS Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<Navigate to="mapper" />} />
          <Route path="mapper" element={<RoadmapMapper />} />
          <Route path="lesson" element={<LessonBuilder />} />
          <Route path="concepts" element={<ConceptEditor />} />
          <Route path="grammar" element={<GrammarEditor />} />
          <Route path="articles" element={<ArticleEditor />} />
          <Route path="vocab" element={<VocabEditor />} />
          <Route path="tones" element={<ToneWordEditor />} />
          <Route path="kinship" element={<KinshipEditor />} />
          <Route path="drills" element={<DrillEditor />} />
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
