import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import RecipeModal from './RecipeModal';
import LikeButton from './LikeButton';
import { generateRecipePDF } from '../lib/pdfGenerator';

const ITEMS_PER_PAGE = 12;

export default function RecipeFeed({ activeFilter, searchQuery, userId, onFindInStores }) {
  const [recipes, setRecipes] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // New state to store IDs of recipes the user has liked
  const [userLikedIds, setUserLikedIds] = useState(new Set());

  const observer = useRef();
  const lastRecipeElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && activeFilter === 'All' && !searchQuery) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, activeFilter, searchQuery]);

  // 1. New function to fetch all user likes in ONE call
  const fetchUserLikes = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('recipe_id')
        .eq('user_id', userId);

      if (error) throw error;

      // Store in a Set for ultra-fast O(1) lookups
      const likedSet = new Set(data.map(item => item.recipe_id));
      setUserLikedIds(likedSet);
    } catch (err) {
      console.error("Error fetching batch likes:", err.message);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [userId]); // Refetch if user changes

  useEffect(() => {
    if (page > 0) {
      fetchRecipes(page);
    }
  }, [page]);

  async function fetchInitialData() {
    setLoading(true);
    // Fetch recipes, trending, AND user likes simultaneously
    await Promise.all([
      fetchTrending(),
      fetchRecipes(0, true),
      fetchUserLikes()
    ]);
    setLoading(false);
  }

  const attachLikeCounts = async (recipeList) => {
    if (!recipeList.length) return recipeList;
    const recipeIds = recipeList.map(r => r.id);
    
    try {
      // BATCH FETCH: Get all likes for all retrieved recipes in ONE query
      const { data: allLikes, error } = await supabase
        .from('likes')
        .select('recipe_id')
        .in('recipe_id', recipeIds);

      if (error) throw error;

      // Group counts locally
      const counts = {};
      allLikes.forEach(like => {
        counts[like.recipe_id] = (counts[like.recipe_id] || 0) + 1;
      });

      return recipeList.map(r => ({
        ...r,
        like_count: counts[r.id] || 0
      }));
    } catch (err) {
      console.error("Batch likes error:", err);
      return recipeList.map(r => ({ ...r, like_count: 0 }));
    }
  };

  async function fetchTrending() {
    const { data } = await supabase
      .from('recipes')
      .select('*, categories(name, region)')
      .eq('status', 'approved')
      .limit(10);

    if (data) {
      const withLikes = await attachLikeCounts(data);
      const sorted = withLikes.sort((a, b) => b.like_count - a.like_count).slice(0, 5);
      setTrending(sorted);
    }
  }

  async function fetchRecipes(pageIndex, isInitial = false) {
    try {
      if (!isInitial) setLoadingMore(true);
      const from = pageIndex * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('recipes')
        .select('*, categories(name, region)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        const withLikes = await attachLikeCounts(data);
        setRecipes(prev => {
          if (isInitial) return withLikes;
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueNewRecipes = withLikes.filter(r => !existingIds.has(r.id));
          return [...prev, ...uniqueNewRecipes];
        });
        if (data.length < ITEMS_PER_PAGE) setHasMore(false);
      }
    } catch (err) {
      console.error("Feed fetch error:", err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredRecipes = (recipes || []).filter((recipe) => {
    if (!recipe) return false;
    const title = (recipe.title || "").toLowerCase();
    const search = (searchQuery || "").toLowerCase();
    const dbRegion = (recipe.categories?.region || "Continental").toLowerCase();
    const activeBtn = (activeFilter || "All").toLowerCase();

    const matchesCategory =
      activeBtn === 'all' ||
      dbRegion.includes(activeBtn.replace('n', '')) ||
      activeBtn.includes(dbRegion);

    return matchesCategory && title.includes(search);
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: '#5C4033', fontFamily: 'Playfair Display' }}>
      🌍 Seasoning the heritage feed...
    </div>
  );

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .trending-container {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 10px 20px 25px 20px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .trending-container::-webkit-scrollbar { display: none; }

        .recipe-reel {
          scroll-snap-align: start;
          flex: 0 0 160px;
          height: 280px;   
          border-radius: 18px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
        }

        @media (min-width: 480px) {
          .recipe-reel {
            flex: 0 0 200px;
            height: 340px;
          }
        }
      `}</style>

      {/* TRENDING SECTION */}
      {activeFilter === 'All' && !searchQuery && trending.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.6rem', color: '#1A120B', margin: 0 }}>Trending</h2>
            <div style={styles.trendBadge}>TOP 5 🔥</div>
          </div>

          <div className="trending-container">
            {trending.map(recipe => (
              <div
                key={`trend-${recipe.id}`}
                className="recipe-reel"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <img src={recipe.image_url} style={styles.trendingImg} alt={recipe.title} />

                {recipe.location && (
                  <div style={styles.locationTagFloat}>📍 {recipe.location}</div>
                )}

                <div style={styles.trendingOverlay}>
                  <span style={styles.regionSubTag}>
                    {recipe.categories?.region || 'Heritage'}
                  </span>
                  <h4 style={styles.reelTitle}>{recipe.title}</h4>
                  <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>❤️ {recipe.like_count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN RECIPE GRID */}
      {filteredRecipes.length > 0 ? (
        <div className="recipe-grid" style={styles.gridContainer}>
          {filteredRecipes.map((recipe, index) => {
            const isLastElement = filteredRecipes.length === index + 1;
            return (
              <div
                key={`feed-${recipe.id}`}
                ref={isLastElement ? lastRecipeElementRef : null}
                className="recipe-card"
                style={styles.card}
              >
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
                  <img src={recipe.image_url} alt={recipe.title} loading="lazy" style={styles.cardImg} />
                  {recipe.location && <div style={styles.locationTag}>📍 {recipe.location}</div>}
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={styles.regionBadge}>{recipe.categories?.region}</span>
                    {/* Pass the liked status directly to prevent 406 errors */}
                    <LikeButton
                      recipeId={recipe.id}
                      initialLikes={recipe.like_count}
                      userId={userId}
                      isInitiallyLiked={userLikedIds.has(recipe.id)}
                    />
                  </div>
                  <h3 style={styles.cardTitle}>{recipe.title}</h3>
                  <p style={styles.descriptionSnippet}>
                    {recipe.short_description || 'No description available.'}
                  </p>
                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '0.9rem', color: '#888' }}>⏱️ {recipe.cooking_time} mins</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await generateRecipePDF(recipe);
                          } catch (err) {
                            console.error("Card PDF Error:", err);
                          }
                        }} 
                        style={styles.cardDownloadBtn}
                        title="Download PDF"
                      >
                        📥
                      </button>
                      <button onClick={() => setSelectedRecipe(recipe)} style={styles.detailBtn}>View Detail</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          {/* ... empty state content ... */}
        </div>
      )}

      {loadingMore && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.1rem', color: '#E2725B', fontFamily: 'Playfair Display' }}>
          🥘 Stirring up more recipes...
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
          onFindInStores={onFindInStores}
        />
      )}
    </div>
  );
}

const styles = {
  // ... (all your existing styles)
  trendingImg: { width: '100%', height: '100%', objectFit: 'cover' },
  trendBadge: { color: '#E2725B', border: '1px solid #E2725B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '900', letterSpacing: '2px' },
  locationTagFloat: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '0.55rem',
    fontWeight: 'bold',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '15px 12px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '70%'
  },
  reelTitle: { margin: '4px 0', fontSize: '0.9rem', fontFamily: 'Playfair Display', lineHeight: '1.2', fontWeight: '600' },
  regionSubTag: { fontSize: '0.55rem', fontWeight: '900', color: '#E2725B', textTransform: 'uppercase', letterSpacing: '1px' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px', padding: '20px' },
  card: { background: '#fff', borderRadius: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' },
  cardImg: { width: '100%', height: '220px', objectFit: 'cover' },
  locationTag: { position: 'absolute', top: '12px', left: '12px', background: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: '#5C4033' },
  regionBadge: { background: '#FDFCFB', color: '#E2725B', border: '1px solid #F0EBE3', padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '1.35rem', fontFamily: 'Playfair Display, serif', color: '#1A120B' },
  descriptionSnippet: { fontSize: '0.88rem', color: '#666', lineHeight: '1.5', height: '3em', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' },
  detailBtn: { background: '#5C4033', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold' },
  cardDownloadBtn: {
    background: '#FDFCFB',
    border: '1px solid #EBE5DF',
    color: '#5C4033',
    padding: '8px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  emptyState: { textAlign: 'center', padding: '80px 20px', background: '#FDFCFB', borderRadius: '40px', margin: '20px', border: '1px dashed #E5E5E5' }
};