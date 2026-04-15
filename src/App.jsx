import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import RecipeFeed from './components/RecipeFeed';
import Auth from './components/Auth';
import FilterBar from './components/FilterBar';
import BlogFeed from './components/BlogFeed';
import StoresFeed from './components/StoresFeed';

import Identity from './components/Identity';
import ShareRecipe from './components/ShareRecipe';
import PostBlog from './components/PostBlog';
import MyLibrary from './components/MyLibrary';
import Chatbot from './components/Chatbot';

// --- MINIMALIST ICON SET ---
const Icons = {
  Profile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  Recipe: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6.5 4 4 0 0 1 16 8V5a2 2 0 0 1 2-2" /><path d="M2 21h20" /><path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" /><path d="M21 12.12A4 4 0 0 0 16 8" /></svg>
  ),
  Story: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  ),
  Library: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
  ),
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  SignOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  )
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('recipes');
  const [selectedRecipeForStores, setSelectedRecipeForStores] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const dropdownRef = useRef(null);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Supabase Session Error:", error.message);
        if (error.message.includes("Refresh Token")) {
          supabase.auth.signOut();
        }
      }
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuth(false);
        fetchUserProfile(session.user.id);
      } else {
        setActiveModal(null);
        setShowDropdown(false);
        setProfile(null);
      }
    });

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    // PWA Install Logic
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Check for iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    setIsIOS(checkIOS());

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      setShowDropdown(false);
      return;
    }

    if (!deferredPrompt) {
      alert("App is already installed or your browser doesn't support installation.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowDropdown(false);
  };

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setShowDropdown(false);
  };

  const openEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setActiveModal('recipe');
    setShowDropdown(false);
  };

  const closeModals = () => {
    setActiveModal(null);
    setEditingRecipe(null);
    if (session) fetchUserProfile(session.user.id);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', overflowX: 'hidden' }}>
      <style>{`
        :root { --nav-height: 70px; }
        html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; position: relative; }
        
        .hero-section {
          padding: 100px 20px;
          text-align: center;
          /* Style is mostly in index.css now, but keeping layout properties */
          width: 100%; box-sizing: border-box;
        }

        .dropdown-item {
          transition: all 0.2s ease;
          border: none;
          background: none;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          color: var(--primary);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .dropdown-item svg {
          opacity: 0.6;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: var(--bg);
          color: var(--accent) !important;
          transform: translateX(5px);
        }

        .dropdown-item:hover svg {
          opacity: 1;
          stroke: var(--accent);
        }

        @media (max-width: 768px) {
          .hero-section h1 { font-size: 2.2rem !important; }
          .nav-container { padding: 0 20px !important; }
        }

        .nav-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }
      `}</style>

      {/* --- NAVIGATION BAR --- */}
      <nav className="nav-container" style={styles.nav}>
        <h2
          style={styles.logo}
          onClick={() => {
            setActiveFilter('All'); setShowAuth(false); setActiveModal(null); setViewMode('recipes');
          }}
        >
          AfriFood
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {session ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={styles.profileAvatar}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="nav-avatar-img" />
                ) : (
                  profile?.display_name ? profile.display_name[0].toUpperCase() : session.user.email[0].toUpperCase()
                )}
              </div>

              {showDropdown && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownHeader}>
                    {profile?.display_name || session.user.email}
                  </div>

                  <button className="dropdown-item" onClick={() => openModal('profile')}>
                    <Icons.Profile /> Edit Identity
                  </button>
                  <button className="dropdown-item" onClick={() => openModal('recipe')}>
                    <Icons.Recipe /> Share Recipe
                  </button>
                  <button className="dropdown-item" onClick={() => openModal('blog')}>
                    <Icons.Story /> Post Story
                  </button>
                  <button className="dropdown-item" onClick={() => openModal('library')}>
                    <Icons.Library /> My Library
                  </button>

                  <button className="dropdown-item" onClick={handleInstallApp} style={{ color: 'var(--accent)' }}>
                    <Icons.Download /> Install AfriFood App
                  </button>

                  <hr style={styles.divider} />

                  <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <Icons.Home /> Return to Feed
                  </button>
                  <button
                    className="dropdown-item"
                    style={{ color: '#d9534f' }}
                    onClick={() => supabase.auth.signOut()}
                  >
                    <Icons.SignOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowAuth(!showAuth)} style={styles.authBtn}>
              {showAuth ? 'Back Home' : 'Login'}
            </button>
          )}
        </div>
      </nav>

      {/* --- COMPONENT MODALS --- */}
      {activeModal === 'profile' && <Identity user={session.user} onClose={closeModals} />}
      {activeModal === 'recipe' && <ShareRecipe user={session.user} onClose={closeModals} initialRecipe={editingRecipe} />}
      {activeModal === 'blog' && <PostBlog user={session.user} onClose={closeModals} />}
      {activeModal === 'library' && <MyLibrary user={session.user} onClose={closeModals} onEditRecipe={openEditRecipe} />}

      {/* --- MAIN FEED VIEWS --- */}
      {showAuth ? (
        <Auth />
      ) : (
        <div style={{ width: '100%' }}>
          <header className="hero-section">
            <h1 style={{ fontSize: 'clamp(2.2rem, 8vw, 3.5rem)', marginBottom: '10px', fontWeight: '900', fontFamily: 'Playfair Display' }}>Taste the Heritage.</h1>
            <p style={{ fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', opacity: 0.9 }}>Digital preservation of Africa’s culinary secrets.</p>
          </header>

          <div className="toggle-container" style={styles.toggleContainer}>
            <div style={styles.togglePill}>
              <button
                onClick={() => setViewMode('recipes')}
                style={viewMode === 'recipes' ? styles.activeToggle : styles.inactiveToggle}
              >
                Recipes
              </button>
              <button
                onClick={() => setViewMode('blogs')}
                style={viewMode === 'blogs' ? styles.activeToggle : styles.inactiveToggle}
              >
                Blogs
              </button>
              <button
                onClick={() => {
                  setViewMode('stores');
                  setSelectedRecipeForStores(null);
                }}
                style={viewMode === 'stores' ? styles.activeToggle : styles.inactiveToggle}
              >
                Stores
              </button>
            </div>
          </div>

          <div style={styles.mainContent}>
            {viewMode === 'recipes' ? (
              <>
                <FilterBar
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  setSearchQuery={setSearchQuery}
                />

                <div style={{ textAlign: 'center', margin: '30px 0' }}>
                  <h2 style={styles.viewTitle}>
                    {activeFilter === 'All' ? 'Latest Discoveries' : `${activeFilter} Specialties`}
                  </h2>
                  <div style={styles.accentLine}></div>
                </div>

                <RecipeFeed
                  activeFilter={activeFilter}
                  searchQuery={searchQuery}
                  userId={session?.user?.id}
                  onFindInStores={(recipe) => {
                    setSelectedRecipeForStores(recipe);
                    setViewMode('stores');
                  }}
                />
              </>
            ) : viewMode === 'blogs' ? (
              <BlogFeed searchQuery={searchQuery} />
            ) : (
              <StoresFeed recipeFilter={selectedRecipeForStores} />
            )}
          </div>
        </div>
      )}
      <Chatbot />

      {/* iOS Installation Guide Overlay */}
      {showIOSGuide && (
        <div style={styles.guideOverlay} onClick={() => setShowIOSGuide(false)}>
          <div style={styles.guideModal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Playfair Display' }}>Install on iPhone</h2>
            <ol style={styles.guideList}>
              <li>Open this site in <strong>Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> button (square with up arrow).</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
            </ol>
            <button onClick={() => setShowIOSGuide(false)} style={styles.guideCloseBtn}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  nav: {
    padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(250, 249, 246, 0.9)', position: 'sticky', top: 0, zIndex: 1000,
    backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(74, 50, 40, 0.08)',
    height: '70px', width: '100%', boxSizing: 'border-box'
  },
  logo: {
    margin: 0, color: 'var(--primary)', letterSpacing: '-1.5px', cursor: 'pointer',
    fontFamily: 'Playfair Display, serif', fontSize: '1.6rem'
  },
  authBtn: {
    background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 24px',
    borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
  },
  profileAvatar: {
    width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--accent)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(226, 114, 91, 0.3)',
    overflow: 'hidden'
  },
  dropdownMenu: {
    position: 'absolute', top: '55px', right: 0, width: '230px', backgroundColor: 'white',
    borderRadius: '20px', boxShadow: '0 15px 40px rgba(74, 50, 40, 0.12)', padding: '12px',
    display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #EBE5DF'
  },
  dropdownHeader: {
    padding: '8px 12px', fontSize: '0.75rem', color: '#AAA', textTransform: 'uppercase',
    letterSpacing: '1.2px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  divider: { border: 'none', borderTop: '1px solid #EBE5DF', margin: '8px 0' },
  toggleContainer: {
    width: '100%', display: 'flex', justifyContent: 'center', margin: '20px 0'
  },
  togglePill: {
    display: 'flex', background: '#EBE5DF', padding: '6px', borderRadius: '50px', gap: '5px'
  },
  activeToggle: {
    background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 28px',
    borderRadius: '40px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer'
  },
  inactiveToggle: {
    background: 'transparent', color: 'var(--primary)', border: 'none', padding: '12px 28px',
    borderRadius: '40px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', opacity: 0.5
  },
  mainContent: {
    width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box'
  },
  viewTitle: { fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', fontFamily: 'Playfair Display', margin: 0, color: 'var(--primary)' },
  accentLine: { width: '50px', height: '4px', background: 'var(--accent)', margin: '15px auto', borderRadius: '10px' },
  guideOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  guideModal: { background: 'white', padding: '30px', borderRadius: '30px', maxWidth: '400px', width: '100%', textAlign: 'center' },
  guideList: { textAlign: 'left', margin: '20px 0', lineHeight: '1.8' },
  guideCloseBtn: { background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;