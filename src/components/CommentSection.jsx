import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CommentSection({ targetId, type }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // type determines which column we query/insert into ('recipe_id' or 'blog_id')
  const columnRef = type === 'recipe' ? 'recipe_id' : 'blog_id';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    if (targetId) fetchComments();
  }, [targetId]);

  async function fetchComments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url)')
      .eq(columnRef, targetId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert([
        { 
          [columnRef]: targetId, 
          user_id: user.id, 
          content: newComment.trim() 
        }
      ]);
      
    if (!error) {
      setNewComment('');
      fetchComments(); // Refresh list
    } else {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Ensure the comments table exists in your database.');
    }
    setSubmitting(false);
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Comments ({comments.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            style={styles.textarea}
            rows={3}
            disabled={submitting}
          />
          <button 
            type="submit" 
            style={styles.submitBtn} 
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div style={styles.loginPrompt}>
          Please log in to leave a comment.
        </div>
      )}

      {loading ? (
        <p style={styles.loadingText}>Loading comments...</p>
      ) : (
        <div style={styles.commentList}>
          {comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
               <img 
                  src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.profiles?.display_name || 'User'}`} 
                  alt="Avatar" 
                  style={styles.avatar} 
                />
               <div style={styles.commentContent}>
                 <div style={styles.commentHeader}>
                   <strong style={styles.commentName}>{comment.profiles?.display_name || 'Anonymous User'}</strong>
                   <span style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</span>
                 </div>
                 <p style={styles.commentText}>{comment.content}</p>
               </div>
            </div>
          ))}
          
          {comments.length === 0 && !loading && (
             <p style={styles.emptyText}>No comments yet. Be the first to start the discussion!</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' },
  header: { fontFamily: 'Playfair Display', fontSize: '1.4rem', color: '#1A120B', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' },
  textarea: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' },
  submitBtn: { alignSelf: 'flex-end', background: '#E2725B', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  loginPrompt: { padding: '15px', background: '#FDFCFB', borderRadius: '8px', textAlign: 'center', color: '#5C4033', border: '1px dashed #F0EBE3', marginBottom: '30px' },
  loadingText: { color: '#888', fontStyle: 'italic' },
  commentList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  commentCard: { display: 'flex', gap: '15px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
  commentContent: { background: '#FDFCFB', padding: '15px', borderRadius: '0 12px 12px 12px', flex: 1, border: '1px solid #F0EBE3' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' },
  commentName: { fontSize: '0.9rem', color: '#1A120B', fontWeight: 'bold' },
  commentDate: { fontSize: '0.75rem', color: '#888' },
  commentText: { margin: 0, fontSize: '0.95rem', color: '#444', lineHeight: '1.5' },
  emptyText: { color: '#888', fontStyle: 'italic' },
};
