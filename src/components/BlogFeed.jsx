import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- SUB-COMPONENT: BLOG MODAL (THE READER) ---
function BlogModal({ blog, onClose }) {
  if (!blog) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>

        <div style={modalStyles.heroContainer}>
          <img
            src={blog.image_url}
            style={modalStyles.heroImg}
            alt={blog.title}
          />
          <div style={modalStyles.heroOverlay}>
            <h2 style={modalStyles.modalTitle}>{blog.title}</h2>
          </div>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.meta}>
            <div style={styles.authorGroup}>
              <img
                src={blog.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${blog.profiles?.display_name}`}
                style={styles.authorAvatar}
                alt="Author"
              />
              <div>
                <div style={styles.authorName}>{blog.profiles?.display_name}</div>
                <div style={styles.dateRow}>
                  <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  <span style={styles.dot}>•</span>
                  <span>{calculateReadTime(blog.content)} min read</span>
                </div>
              </div>
            </div>
          </div>

          <div style={modalStyles.textContent}>
            {blog.content.split('\n').map((para, i) => (
              <p key={i} style={modalStyles.paragraph}>{para}</p>
            ))}
          </div>

          <button style={modalStyles.footerBtn} onClick={onClose}>Done Reading</button>
        </div>
      </div>
    </div>
  );
}

const calculateReadTime = (text) => {
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

export default function BlogFeed({ searchQuery }) {
  const [blogs, setBlogs] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    fetchInitialBlogs();
  }, []);

  async function fetchInitialBlogs() {
    setLoading(true);
    const { data } = await supabase
      .from('blogs')
      .select(`*, profiles (display_name, avatar_url)`)
      .order('created_at', { ascending: false });

    if (data) {
      setBlogs(data);
      setTrendingBlogs(data.slice(0, 5));
    }
    setLoading(false);
  }

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: '#5C4033' }}>📜 Unrolling the scrolls...</div>;

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .stories-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 10px 20px 25px 20px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .stories-scroll::-webkit-scrollbar { display: none; }
        
        .story-card {
          scroll-snap-align: start;
          flex: 0 0 160px; /* Vertical Reel Width */
          height: 280px;   /* Vertical Reel Height */
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          transition: transform 0.3s ease;
        }

        @media (min-width: 600px) {
          .story-card {
            flex: 0 0 200px;
            height: 340px;
          }
        }
      `}</style>

      {!searchQuery && trendingBlogs.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.6rem', color: '#1A120B', margin: 0 }}>Featured</h2>
            <div style={styles.trendBadge}>STORIES</div>
          </div>

          <div className="stories-scroll">
            {trendingBlogs.map(blog => (
              <div
                key={`trend-${blog.id}`}
                className="story-card"
                onClick={() => setSelectedBlog(blog)}
              >
                <img src={blog.image_url} style={styles.trendingImg} alt={blog.title} />
                <div style={styles.trendingOverlay}>
                  <div style={styles.readTimeFloater}>🕒 {calculateReadTime(blog.content)}m</div>
                  <span style={styles.authorTag}>BY {blog.profiles?.display_name?.toUpperCase() || 'CHEF'}</span>
                  <h4 style={styles.reelTitle}>{blog.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recipe-grid" style={{ padding: '20px' }}>
        {filteredBlogs.map((blog) => (
          <div key={`grid-${blog.id}`} className="recipe-card" style={styles.card} onClick={() => setSelectedBlog(blog)}>
            <div style={{ position: 'relative' }}>
              <img src={blog.image_url} style={styles.gridImg} alt={blog.title} />
              <div style={styles.gridTimeTag}>{calculateReadTime(blog.content)} min read</div>
            </div>
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={styles.cardHeader}>
                <div style={styles.authorGroup}>
                  <img
                    src={blog.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${blog.profiles?.display_name}`}
                    style={styles.authorAvatarSmall}
                    alt="Author"
                  />
                  <span style={styles.authorNameSmall}>{blog.profiles?.display_name}</span>
                </div>
                <span style={styles.dateTag}>{new Date(blog.created_at).toLocaleDateString()}</span>
              </div>

              <h3 style={styles.gridTitle}>{blog.title}</h3>
              <p style={styles.excerpt}>{blog.content?.substring(0, 100)}...</p>

              <div style={{ marginTop: 'auto' }}>
                <button style={styles.detailBtn}>Open Story</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedBlog && (
        <BlogModal
          blog={selectedBlog}
          onClose={() => setSelectedBlog(null)}
        />
      )}
    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '15px', backdropFilter: 'blur(10px)', overflowX: 'hidden' },
  content: { backgroundColor: '#fff', width: '100%', maxWidth: '800px', maxHeight: '92vh', borderRadius: '35px', overflowY: 'auto', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', boxSizing: 'border-box' },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontWeight: 'bold', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  heroContainer: { position: 'relative', height: 'min(350px, 40vh)', width: '100%' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', display: 'flex', alignItems: 'flex-end', padding: '30px' },
  modalTitle: { color: '#fff', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', fontFamily: 'Playfair Display', margin: 0 },
  body: { padding: 'clamp(20px, 5vw, 40px)', boxSizing: 'border-box' },
  meta: { marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' },
  textContent: { lineHeight: '1.8', fontSize: '1.05rem', color: '#333' },
  paragraph: { marginBottom: '20px' },
  footerBtn: { background: '#5C4033', color: 'white', border: 'none', width: '100%', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }
};

const styles = {
  trendingImg: { width: '100%', height: '100%', objectFit: 'cover' },
  trendBadge: { color: '#E2725B', border: '1px solid #E2725B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.5rem', fontWeight: '900', letterSpacing: '2px' },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '70%' },
  readTimeFloater: { position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '0.55rem', border: '1px solid rgba(255,255,255,0.3)' },
  reelTitle: { margin: '4px 0', fontSize: '0.9rem', fontFamily: 'Playfair Display', lineHeight: '1.2', fontWeight: '600' },

  card: { height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', background: '#fff', border: '1px solid #f0f0f0' },
  gridImg: { width: '100%', height: '220px', objectFit: 'cover' },
  gridTimeTag: { position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.6rem', backdropFilter: 'blur(4px)' },
  gridTitle: { margin: '0 0 10px 0', fontSize: '1.3rem', fontFamily: 'Playfair Display', color: '#1A120B' },

  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  authorGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  authorAvatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
  authorAvatarSmall: { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' },
  authorName: { fontSize: '0.95rem', fontWeight: 'bold' },
  authorNameSmall: { fontSize: '0.8rem', fontWeight: '600', color: '#5C4033' },
  dateRow: { fontSize: '0.75rem', color: '#888', display: 'flex', gap: '5px' },
  dateTag: { fontSize: '0.7rem', color: '#999' },
  dot: { color: '#E2725B' },

  authorTag: { fontSize: '0.55rem', fontWeight: '900', letterSpacing: '1px', opacity: 0.8 },
  excerpt: { fontSize: '0.9rem', color: '#666', lineHeight: '1.5', marginBottom: '15px' },
  detailBtn: { background: '#FDFCFB', color: '#5C4033', border: '1px solid #F0EBE3', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }
};