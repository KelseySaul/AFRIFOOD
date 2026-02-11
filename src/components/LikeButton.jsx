import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LikeButton({ recipeId, initialLikes, userId, isInitiallyLiked }) {
  const [likes, setLikes] = useState(initialLikes || 0);
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);

  // Sync state if the parent props change (important for filtering/searching)
  useEffect(() => {
    setIsLiked(isInitiallyLiked);
  }, [isInitiallyLiked]);

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const toggleLike = async (e) => {
    e.stopPropagation(); // Prevents opening the Recipe Modal
    
    if (!userId) {
      alert("Please login to like recipes! 😊");
      return;
    }

    // --- OPTIMISTIC UI UPDATE ---
    // We update the screen immediately so the user doesn't feel lag
    const previousLiked = isLiked;
    const previousCount = likes;

    setIsLiked(!previousLiked);
    setLikes(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      if (previousLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({ recipe_id: recipeId, user_id: userId });
        
        if (error) throw error;
      }
    } catch (err) {
      // --- ROLLBACK ON ERROR ---
      // If the database fails, we quietly switch it back
      console.error("Like toggle failed:", err.message);
      setIsLiked(previousLiked);
      setLikes(previousCount);
    }
  };

  return (
    <button onClick={toggleLike} style={styles.btn}>
      <span style={{ 
        color: isLiked ? '#E2725B' : '#ccc', 
        fontSize: '1.2rem',
        transition: 'transform 0.2s ease'
      }}
      className={isLiked ? 'heart-pop' : ''}
      >
        {isLiked ? '❤️' : '🤍'}
      </span>
      <span style={styles.countText}>{likes}</span>

      <style>{`
        .heart-pop {
          transform: scale(1.2);
        }
        button:active .heart-pop {
          transform: scale(0.9);
        }
      `}</style>
    </button>
  );
}

const styles = {
  btn: {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: '20px',
    padding: '5px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  },
  countText: { 
    fontSize: '0.9rem', 
    fontWeight: 'bold', 
    color: '#5C4033' 
  }
};