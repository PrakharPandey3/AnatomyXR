import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowRight, Bookmark, BookOpen, Check, ChevronDown, CircleHelp, Clock3, Compass, GraduationCap, HeartPulse, Layers3, LogIn, LogOut, Menu, Microscope, Search, ShieldCheck, Sparkles, Target, UserRound, X } from 'lucide-react';
import AnatomicalHeart from './components/AnatomicalHeart.jsx';
import RealisticHeart from './components/RealisticHeart.jsx';
import AuthModal from './components/AuthModal.jsx';
import api from './lib/api.js';

const fallbackStructures = [
  { id: 'right-atrium', name: 'Right atrium', system: 'Circulatory', region: 'Upper right chamber', function: 'Receives deoxygenated blood returning from the body through the venae cavae.', facts: ['Forms the right-sided receiving chamber of the heart.', 'Blood passes through the tricuspid valve into the right ventricle.'], color: '#df687d' },
  { id: 'right-ventricle', name: 'Right ventricle', system: 'Circulatory', region: 'Lower right chamber', function: 'Pumps deoxygenated blood toward the lungs through the pulmonary trunk.', facts: ['Its wall is thinner than the left ventricle wall.', 'The pulmonary valve guards its outflow.'], color: '#c84e69' },
  { id: 'left-atrium', name: 'Left atrium', system: 'Circulatory', region: 'Upper left chamber', function: 'Receives oxygenated blood from the pulmonary veins.', facts: ['It receives blood from the lungs.', 'Blood flows through the mitral valve into the left ventricle.'], color: '#e58c9a' },
  { id: 'left-ventricle', name: 'Left ventricle', system: 'Circulatory', region: 'Lower left chamber', function: 'Pumps oxygenated blood into the aorta for distribution around the body.', facts: ['It has the thickest myocardium of the four chambers.', 'It generates the pressure needed for systemic circulation.'], color: '#b93b55' },
  { id: 'aorta', name: 'Aorta', system: 'Circulatory', region: 'Main systemic artery', function: 'Carries oxygen-rich blood from the left ventricle to the systemic circulation.', facts: ['The aortic valve lies between the left ventricle and aorta.', 'Its branches supply the head, arms, trunk, and lower body.'], color: '#df594d' },
  { id: 'pulmonary-artery', name: 'Pulmonary trunk', system: 'Circulatory', region: 'Outflow to the lungs', function: 'Carries deoxygenated blood from the right ventricle toward the lungs.', facts: ['It divides into left and right pulmonary arteries.', 'Pulmonary arteries carry deoxygenated blood, unlike most systemic arteries.'], color: '#4f9ac5' },
  { id: 'vena-cava', name: 'Venae cavae', system: 'Circulatory', region: 'Systemic venous return', function: 'The superior and inferior vena cava return deoxygenated blood to the right atrium.', facts: ['The superior vena cava drains the upper body.', 'The inferior vena cava drains much of the lower body.'], color: '#508cc1' },
  { id: 'pulmonary-veins', name: 'Pulmonary veins', system: 'Circulatory', region: 'Return from lungs', function: 'Carry oxygenated blood from the lungs to the left atrium.', facts: ['Most people have four pulmonary veins.', 'They are veins that carry oxygenated blood.'], color: '#d97891' }
];

const navItems = [
  { id: 'explore', label: 'Explore lab', icon: Compass },
  { id: 'learn', label: 'Learn & practice', icon: GraduationCap },
  { id: 'dashboard', label: 'My progress', icon: Target }
];

function App() {
  const [activePage, setActivePage] = useState('explore');
  const [structures, setStructures] = useState(fallbackStructures);
  const [selectedId, setSelectedId] = useState('left-ventricle');
  const [query, setQuery] = useState('');
  const [layers, setLayers] = useState({ chambers: true, vessels: true });
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  const showNotice = useCallback((message, type = 'success') => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3800);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!user) { setDashboard(null); return; }
    try {
      const { data } = await api.get('/dashboard');
      setDashboard(data);
      setBookmarks(data.bookmarkedStructures.map((item) => item.id));
    } catch (error) { showNotice(error.message, 'error'); }
  }, [user, showNotice]);

  useEffect(() => {
    let alive = true;
    async function boot() {
      setLoading(true);
      try {
        const [structureResponse, quizResponse] = await Promise.all([api.get('/structures'), api.get('/quizzes')]);
        if (alive) { setStructures(structureResponse.data.structures); setQuizzes(quizResponse.data.quizzes); }
      } catch {
        if (alive) showNotice('Using local learning content. Start the backend and MongoDB to enable accounts and saved progress.', 'error');
      }
      try {
        const { data } = await api.get('/auth/me');
        if (alive) { setUser(data.user); setBookmarks(data.user.bookmarks || []); }
      } catch { /* Guests can explore without signing in. */ }
      if (alive) setLoading(false);
    }
    boot();
    return () => { alive = false; };
  }, [showNotice]);

  useEffect(() => { if (user) loadDashboard(); }, [user, loadDashboard]);

  const selected = structures.find((item) => item.id === selectedId) || structures[0];
  const filteredStructures = useMemo(() => structures.filter((item) => `${item.name} ${item.region} ${item.function}`.toLowerCase().includes(query.toLowerCase().trim())), [structures, query]);

  async function toggleBookmark(id) {
    if (!user) { setAuthMode('login'); showNotice('Log in to save structures to your lab.', 'info'); return; }
    try {
      const { data } = await api.put(`/bookmarks/${id}`);
      setBookmarks(data.bookmarks);
      showNotice(data.bookmarked ? 'Structure saved to your bookmarks.' : 'Bookmark removed.');
      loadDashboard();
    } catch (error) { showNotice(error.message, 'error'); }
  }

  async function openQuiz(id) {
    setQuizResult(null); setAnswers({});
    try {
      const { data } = await api.get(`/quizzes/${id}`);
      setActiveQuiz(data.quiz); setActivePage('learn');
    } catch (error) { showNotice(error.message, 'error'); }
  }

  async function submitQuiz() {
    if (!user) { setAuthMode('login'); showNotice('Log in to submit a quiz and save your score.', 'info'); return; }
    if (!activeQuiz || Object.keys(answers).length !== activeQuiz.questions.length) { showNotice('Answer every question before submitting.', 'error'); return; }
    try {
      const { data } = await api.post(`/quizzes/${activeQuiz.id}/submit`, { answers });
      setQuizResult(data); loadDashboard(); showNotice('Quiz submitted. Your score has been saved.');
    } catch (error) { showNotice(error.message, 'error'); }
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch { /* Clear local UI even if the session has expired. */ }
    setUser(null); setBookmarks([]); setDashboard(null); setActivePage('explore'); showNotice('You have been logged out.');
  }

  function handleAuthSuccess(nextUser) {
    setUser(nextUser); setBookmarks(nextUser.bookmarks || []); setAuthMode(null); showNotice(`Welcome${nextUser.name ? `, ${nextUser.name.split(' ')[0]}` : ''}! Your lab is ready.`);
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Activity size={23}/></div><div className="brand-word">anatomy<span>XR</span><small>INTERACTIVE LAB</small></div><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activePage === id ? 'nav-active' : ''}`} onClick={() => { setActivePage(id); setActiveQuiz(null); setMobileNav(false); }}><Icon size={18}/><span>{label}</span>{id === 'dashboard' && bookmarks.length > 0 && <span className="nav-count">{bookmarks.length}</span>}</button>)}
      </nav>
      <div className="sidebar-divider"/>
      <div className="workspace-label">ANATOMY SYSTEMS</div>
      <button className="system-item system-selected" onClick={() => { setActivePage('explore'); setSelectedId('left-ventricle'); }}><span className="system-icon heart-icon"><HeartPulse size={17}/></span><span>Cardiovascular</span><span className="system-dot"/></button>
      <button className="system-item disabled-system" onClick={() => showNotice('More systems are planned for a future version.', 'info')}><span className="system-icon"><Layers3 size={17}/></span><span>Skeletal system</span><span className="coming-soon">SOON</span></button>
      <button className="system-item disabled-system" onClick={() => showNotice('More systems are planned for a future version.', 'info')}><span className="system-icon"><Activity size={17}/></span><span>Muscular system</span><span className="coming-soon">SOON</span></button>
      <div className="sidebar-bottom">
        <div className="learning-card"><div className="learning-card-icon"><Microscope size={17}/></div><div><strong>Curiosity, visualized.</strong><p>Explore anatomy in a new dimension.</p></div></div>
        {user ? <div className="user-card"><div className="avatar">{user.name?.slice(0, 1).toUpperCase() || 'U'}</div><div className="user-meta"><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-button" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={17}/></button></div> : <button className="sidebar-login" onClick={() => setAuthMode('login')}><LogIn size={17}/> Log in to save progress</button>}
      </div>
    </aside>

    {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button><span className="breadcrumb">Workspace</span><span className="crumb-slash">/</span><span className="breadcrumb-current">{navItems.find((item) => item.id === activePage)?.label || 'Explore lab'}</span></div><div className="topbar-right"><span className="offline-indicator"><span/> Educational mode</span>{user ? <button className="topbar-user" onClick={() => setActivePage('dashboard')}><span className="avatar avatar-small">{user.name?.slice(0, 1).toUpperCase() || 'U'}</span><span>{user.name?.split(' ')[0]}</span><ChevronDown size={14}/></button> : <button className="primary-button top-login" onClick={() => setAuthMode('login')}>Sign in <ArrowRight size={15}/></button>}</div></header>

      {activePage === 'explore' && <section className="page-content explore-page">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> VIRTUAL ANATOMY LAB <span className="heading-badge"><span/> LIVE EXPLORER</span></div><h1>Explore the <span>human heart.</span></h1><p className="page-subtitle">Get closer to the anatomy. Select a structure, uncover its function, and learn how it connects to the bigger picture.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => { setSelectedId('left-ventricle'); setLayers({ chambers: true, vessels: true }); }}><Activity size={16}/> Reset view</button><button className="primary-button" onClick={() => { setActivePage('learn'); setActiveQuiz(null); }}><GraduationCap size={16}/> Start learning</button></div></div>
        <div className="explorer-grid">
          <section className="viewer-panel panel">
            <div className="panel-topline"><div><span className="panel-kicker">3D MODEL / 001</span><h2>Cardiovascular system</h2></div><div className="model-tools"><span className="live-tag"><span/> 3D ACTIVE</span><button className="icon-button" title="Reset selected structure" onClick={() => setSelectedId('left-ventricle')}><Target size={17}/></button></div></div>
            <div className="viewer-stage"><div className="stage-grid"/><div className="axis-label axis-x">X</div><div className="axis-label axis-y">Y</div><div className="stage-label stage-label-top"><span className="stage-label-dot"/> HUMAN HEART <span className="stage-label-muted">/ ANTERIOR VIEW</span></div><RealisticHeart selectedId={selectedId} onSelect={setSelectedId} layers={layers}/><div className="stage-coordinates">ANATOMYXR · MODEL PREVIEW<br/>ROTATE / ZOOM / SELECT</div><div className="stage-legend"><span className="legend-dot oxygenated"/> Oxygenated <span className="legend-dot deoxygenated"/> Deoxygenated</div></div>
            <div className="viewer-footer"><div className="viewer-footer-left"><span className="status-dot"/> Select any visible chamber or vessel to inspect its details.</div><div className="viewer-footer-right"><span>MODEL</span><strong>HEART · 3D</strong></div></div>
          </section>
          <aside className="inspector-column">
            <section className="panel anatomy-panel"><div className="section-heading"><div><span className="panel-kicker">STRUCTURE INSPECTOR</span><h2>Anatomy explorer</h2></div><span className="count-pill">{structures.length} structures</span></div><div className="search-box"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search structures…" aria-label="Search anatomy structures"/>{query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={14}/></button>}</div><div className="structure-list">{filteredStructures.map((item) => <button key={item.id} className={`structure-row ${selectedId === item.id ? 'structure-active' : ''}`} onClick={() => setSelectedId(item.id)}><span className="structure-color" style={{ background: item.color }}/><span className="structure-name-wrap"><strong>{item.name}</strong><small>{item.region}</small></span>{selectedId === item.id ? <span className="selected-check"><Check size={14}/></span> : <ArrowDownRight className="structure-arrow" size={15}/>}</button>)}{filteredStructures.length === 0 && <div className="empty-search">No structures match “{query}”. Try another term.</div>}</div><div className="layer-controls"><div className="layer-heading"><Layers3 size={15}/><strong>Visible layers</strong></div><label className="toggle-row"><span><span className="layer-mini chamber-mini"/> Heart chambers</span><input type="checkbox" checked={layers.chambers} onChange={(event) => setLayers({ ...layers, chambers: event.target.checked })}/><span className="toggle-ui"/></label><label className="toggle-row"><span><span className="layer-mini vessel-mini"/> Major vessels</span><input type="checkbox" checked={layers.vessels} onChange={(event) => setLayers({ ...layers, vessels: event.target.checked })}/><span className="toggle-ui"/></label></div></section>
            <section className="panel selected-panel"><div className="selected-top"><div className="selected-icon" style={{ '--structure-color': selected?.color || '#c84e69' }}><HeartPulse size={19}/></div><div className="selected-heading"><span className="panel-kicker">SELECTED STRUCTURE</span><h2>{selected?.name || 'Select a structure'}</h2></div><button className={`bookmark-button ${bookmarks.includes(selected?.id) ? 'is-bookmarked' : ''}`} onClick={() => selected && toggleBookmark(selected.id)} aria-label={bookmarks.includes(selected?.id) ? 'Remove bookmark' : 'Bookmark structure'} title={bookmarks.includes(selected?.id) ? 'Remove bookmark' : 'Save structure'}><Bookmark size={18} fill={bookmarks.includes(selected?.id) ? 'currentColor' : 'none'}/></button></div><div className="region-tag"><span/> {selected?.region}</div><p className="structure-description">{selected?.function}</p><div className="fact-divider"/><div className="facts-title"><Sparkles size={15}/> KEY FACTS</div><ul className="fact-list">{(selected?.facts || []).map((fact) => <li key={fact}><span/> {fact}</li>)}</ul><div className="inspector-note"><ShieldCheck size={16}/><span>For educational use. This simplified 3D illustration is not a clinical reference model.</span></div></section>
          </aside>
        </div>
        <div className="below-grid"><section className="panel mini-feature"><div className="feature-icon feature-blue"><BookOpen size={19}/></div><div className="feature-copy"><span className="panel-kicker">KEEP EXPLORING</span><h3>Turn curiosity into understanding.</h3><p>Test what you've learned with guided anatomy challenges.</p></div><button className="round-arrow" onClick={() => { setActivePage('learn'); setActiveQuiz(null); }} aria-label="Go to learning"><ArrowRight size={18}/></button></section><section className="panel mini-feature"><div className="feature-icon feature-purple"><Bookmark size={19}/></div><div className="feature-copy"><span className="panel-kicker">YOUR PERSONAL LAB</span><h3>{user ? `${bookmarks.length} saved structure${bookmarks.length === 1 ? '' : 's'}` : 'Build your anatomy collection.'}</h3><p>{user ? 'Revisit your saved structures anytime.' : 'Sign in to bookmark structures and keep your learning progress.'}</p></div><button className="round-arrow" onClick={() => user ? setActivePage('dashboard') : setAuthMode('register')} aria-label="Open personal lab"><ArrowRight size={18}/></button></section></div>
      </section>}

      {activePage === 'learn' && <section className="page-content learning-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> LEARNING STUDIO</div><h1>Learn by <span>doing.</span></h1><p className="page-subtitle">Practice anatomy with short challenges and instant explanations. Your submitted scores are saved to your account.</p></div></div>
        {activeQuiz ? <section className="panel quiz-panel"><div className="quiz-top"><button className="text-button" onClick={() => { setActiveQuiz(null); setQuizResult(null); }}>← All learning activities</button><span className="difficulty-tag">{activeQuiz.difficulty}</span></div><div className="quiz-title-block"><div className="feature-icon feature-blue"><GraduationCap size={21}/></div><div><h2>{activeQuiz.title}</h2><p>{activeQuiz.description}</p></div></div><div className="quiz-progress"><span>{quizResult ? 'Quiz completed' : `${Object.keys(answers).length} of ${activeQuiz.questions.length} answered`}</span><div><span style={{ width: `${quizResult ? 100 : Object.keys(answers).length / activeQuiz.questions.length * 100}%` }}/></div></div>{activeQuiz.questions.map((question, index) => { const result = quizResult?.results?.find((item) => item.questionId === question.id); return <div className="question-card" key={question.id}><div className="question-number">QUESTION {String(index + 1).padStart(2, '0')}</div><h3>{question.prompt}</h3><div className="answer-options">{question.options.map((option, optionIndex) => <button key={option} disabled={!!quizResult} className={`answer-option ${answers[question.id] === optionIndex ? 'answer-selected' : ''} ${result && optionIndex === result.correctIndex ? 'answer-correct' : ''} ${result && answers[question.id] === optionIndex && !result.correct ? 'answer-wrong' : ''}`} onClick={() => setAnswers({ ...answers, [question.id]: optionIndex })}><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}{result && optionIndex === result.correctIndex && <Check size={16}/>}</button>)}</div>{result && <div className={`answer-explanation ${result.correct ? 'explanation-correct' : ''}`}><strong>{result.correct ? 'Correct.' : 'Not quite.'}</strong> {result.explanation}</div>}</div>; })}{quizResult ? <div className="quiz-result"><div className="result-score"><strong>{quizResult.percentage}%</strong><span>{quizResult.score} of {quizResult.total} correct</span></div><div><h3>{quizResult.percentage >= 80 ? 'Excellent work!' : quizResult.percentage >= 60 ? 'Good progress.' : 'Keep practicing.'}</h3><p>Your result has been saved to your learning history.</p></div><button className="primary-button" onClick={() => { setActiveQuiz(null); setQuizResult(null); }}>Back to activities <ArrowRight size={16}/></button></div> : <div className="quiz-submit-row"><span><ShieldCheck size={16}/> Answers are checked by the server.</span><button className="primary-button" onClick={submitQuiz}>Submit answers <ArrowRight size={16}/></button></div>}</section> : <><div className="learning-stats"><div className="panel learning-stat"><span className="stat-icon"><BookOpen size={18}/></span><span className="panel-kicker">AVAILABLE QUIZZES</span><strong>{quizzes.length || 1}</strong><small>Curated learning activities</small></div><div className="panel learning-stat"><span className="stat-icon"><Target size={18}/></span><span className="panel-kicker">YOUR AVERAGE</span><strong>{dashboard?.stats?.averageScore ?? '—'}{dashboard ? '%' : ''}</strong><small>{user ? 'Across completed questions' : 'Sign in to track scores'}</small></div><div className="panel learning-stat"><span className="stat-icon"><Clock3 size={18}/></span><span className="panel-kicker">TIME TO START</span><strong>5 min</strong><small>Short focused practice</small></div></div><div className="content-section-title"><div><span className="panel-kicker">YOUR LEARNING PATH</span><h2>Available activities</h2></div><span className="count-pill">{quizzes.length || 1} activity</span></div><div className="quiz-card-grid">{(quizzes.length ? quizzes : [{ id: 'heart-basics', title: 'Heart foundations', description: 'Check your understanding of the four chambers and major vessels.', difficulty: 'Beginner', questionCount: 5 }]).map((quiz) => <article className="panel quiz-preview" key={quiz.id}><div className="quiz-card-art"><div className="art-ring art-ring-one"/><div className="art-ring art-ring-two"/><div className="quiz-art-icon"><HeartPulse size={31}/></div><span className="difficulty-tag">{quiz.difficulty}</span></div><div className="quiz-card-body"><span className="panel-kicker">CARDIOVASCULAR · FOUNDATIONS</span><h3>{quiz.title}</h3><p>{quiz.description}</p><div className="quiz-meta"><span><CircleHelp size={15}/>{quiz.questionCount} questions</span><span><Clock3 size={15}/>~5 min</span></div><button className="primary-button full-button" onClick={() => openQuiz(quiz.id)}>Start activity <ArrowRight size={16}/></button></div></article>)}</div></>}
      </section>}

      {activePage === 'dashboard' && <section className="page-content dashboard-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PERSONAL WORKSPACE</div><h1>Your anatomy <span>journey.</span></h1><p className="page-subtitle">A record of what you've explored, saved, and learned along the way.</p></div><button className="primary-button" onClick={() => setActivePage('explore')}><Compass size={16}/> Return to lab</button></div>{!user ? <div className="panel dashboard-locked"><div className="locked-icon"><UserRound size={26}/></div><h2>Your personal lab awaits.</h2><p>Create an account to save structures, submit quizzes, and track your learning history across sessions.</p><div className="locked-actions"><button className="primary-button" onClick={() => setAuthMode('register')}>Create free account <ArrowRight size={16}/></button><button className="secondary-button" onClick={() => setAuthMode('login')}>Already a member? Log in</button></div></div> : <><div className="dashboard-welcome"><div><span className="panel-kicker">WELCOME BACK</span><h2>Good to see you, {user.name.split(' ')[0]}.</h2><p>Small discoveries add up. Keep exploring and practicing.</p></div><div className="welcome-symbol"><Activity size={38}/></div></div><div className="dashboard-stat-grid"><div className="panel dashboard-stat"><span className="dashboard-stat-icon purple"><Bookmark size={18}/></span><span className="panel-kicker">SAVED STRUCTURES</span><strong>{dashboard?.stats?.bookmarks ?? bookmarks.length}</strong><small>Personal anatomy collection</small></div><div className="panel dashboard-stat"><span className="dashboard-stat-icon blue"><GraduationCap size={18}/></span><span className="panel-kicker">QUIZ ATTEMPTS</span><strong>{dashboard?.stats?.quizAttempts ?? 0}</strong><small>Submitted learning activities</small></div><div className="panel dashboard-stat"><span className="dashboard-stat-icon green"><Target size={18}/></span><span className="panel-kicker">AVERAGE SCORE</span><strong>{dashboard?.stats?.averageScore ?? 0}%</strong><small>Across all answered questions</small></div></div><div className="dashboard-lower"><section className="panel saved-panel"><div className="section-heading"><div><span className="panel-kicker">YOUR COLLECTION</span><h2>Saved structures</h2></div><span className="count-pill">{dashboard?.bookmarkedStructures?.length || 0} saved</span></div>{dashboard?.bookmarkedStructures?.length ? <div className="saved-list">{dashboard.bookmarkedStructures.map((item) => <button className="saved-row" key={item.id} onClick={() => { setSelectedId(item.id); setActivePage('explore'); }}><span className="structure-color" style={{ background: item.color }}/><span><strong>{item.name}</strong><small>{item.region}</small></span><ArrowRight size={16}/></button>)}</div> : <div className="empty-state"><Bookmark size={24}/><strong>No bookmarks yet</strong><p>Explore the heart and save structures you want to revisit.</p><button className="text-button" onClick={() => setActivePage('explore')}>Explore anatomy <ArrowRight size={15}/></button></div>}</section><section className="panel history-panel"><div className="section-heading"><div><span className="panel-kicker">PRACTICE HISTORY</span><h2>Recent attempts</h2></div><BookOpen size={18} className="muted-icon"/></div>{dashboard?.recentAttempts?.length ? <div className="attempt-list">{dashboard.recentAttempts.map((attempt, index) => <div className="attempt-row" key={`${attempt._id || attempt.quizId}-${index}`}><span className="attempt-icon"><GraduationCap size={17}/></span><span className="attempt-name"><strong>Heart foundations</strong><small>{new Date(attempt.completedAt).toLocaleDateString()}</small></span><span className="attempt-score">{Math.round(attempt.score / attempt.total * 100)}%<small>{attempt.score}/{attempt.total}</small></span></div>)}</div> : <div className="empty-state"><Target size={24}/><strong>No attempts recorded</strong><p>Your submitted quiz results will appear here.</p><button className="text-button" onClick={() => setActivePage('learn')}>Start a quiz <ArrowRight size={15}/></button></div>}</section></div></>}</section>}

      <footer className="app-footer"><div><span className="footer-brand"><Activity size={14}/> AnatomyXR</span><span>Built for curious minds.</span></div><span>Educational prototype · Not for clinical use</span></footer>
    </main>
    {notice && <div className={`toast toast-${notice.type}`} role="status"><span className="toast-mark">{notice.type === 'error' ? '!' : notice.type === 'info' ? 'i' : '✓'}</span>{notice.message}<button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15}/></button></div>}
    {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSuccess={handleAuthSuccess}/>}
    {loading && <div className="boot-indicator"><span className="boot-spinner"/> Preparing your anatomy lab…</div>}
  </div>;
}

export default App;
