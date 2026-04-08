import React, { useRef } from 'react';
import CommentSection from './CommentSection';
import { generateRecipePDF } from '../lib/pdfGenerator';

export default function RecipeModal({ recipe, onClose }) {
  const contentRef = useRef(null);
  if (!recipe) return null;

  const handleDownloadPDF = async () => {
    try {
      await generateRecipePDF(recipe);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const ingredientsList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const stepsList = Array.isArray(recipe.steps) ? recipe.steps : [];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        ref={contentRef}
        style={styles.modalContent} 
        onClick={e => e.stopPropagation()}
      >

        {/* Top Floating Close Button */}
        <button onClick={onClose} style={styles.closeBtn}>✕</button>

        {/* Hero Image Section */}
        <div style={styles.imageWrapper}>
          <img src={recipe.image_url} alt={recipe.title} style={styles.heroImage} />
          <div style={styles.imageOverlay}>
            <span style={styles.regionBadge}>{recipe.categories?.region || 'Heritage'}</span>
            <button onClick={handleDownloadPDF} style={styles.headerDownloadBtn}>
              📥 Download PDF
            </button>
          </div>
        </div>

        <div style={styles.bodyContent}>
          <div style={styles.headerRow}>
            <h2 style={styles.title}>{recipe.title}</h2>
            {recipe.location && <span style={styles.locationText}>📍 {recipe.location}</span>}
          </div>

          <p style={styles.description}>{recipe.detailed_description}</p>

          {/* Quick Info Bar */}
          <div style={styles.infoBar}>
            <div style={styles.infoItem}>
              <span style={styles.iconBg}>⏱️</span>
              <div>
                <small style={styles.infoLabel}>COOKING TIME</small>
                <strong style={styles.infoValue}>{recipe.cooking_time} mins</strong>
              </div>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.iconBg}>🍲</span>
              <div>
                <small style={styles.infoLabel}>DIFFICULTY</small>
                <strong style={styles.infoValue}>{recipe.difficulty || 'Traditional'}</strong>
              </div>
            </div>
          </div>

          <hr style={styles.divider} />

          <div style={styles.contentGrid}>
            {/* Ingredients Section - FIXED to handle both strings and objects */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>Ingredients</h3>
              <ul style={styles.ingredientList}>
                {ingredientsList.length > 0 ? ingredientsList.map((ing, i) => (
                  <li key={i} style={styles.ingredientItem}>
                    <div style={styles.bullet} />
                    <span style={styles.ingText}>
                      {typeof ing === 'object' && ing !== null ? (
                        // If it's an object: {amount: 2, unit: 'cups', item: 'Flour'}
                        `${ing.amount || ''} ${ing.unit || ''} ${ing.item || ''}`.trim()
                      ) : (
                        // If it's just a simple string: "Salt to taste"
                        ing
                      )}
                    </span>
                  </li>
                )) : <li style={styles.emptyText}>No ingredients listed.</li>}
              </ul>
            </div>

            {/* Preparation Steps Section */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>Method</h3>
              <div style={styles.stepsContainer}>
                {stepsList.length > 0 ? stepsList.map((step, i) => (
                  <div key={i} style={styles.stepBox}>
                    <span style={styles.stepNumber}>{i + 1}</span>
                    <p style={styles.stepText}>
                      {typeof step === 'object' && step !== null
                        ? (step.description || step.instruction || JSON.stringify(step))
                        : step}
                    </p>
                  </div>
                )) : <p style={styles.emptyText}>Preparation steps coming soon...</p>}
              </div>
            </div>
          </div>

          <CommentSection targetId={recipe.id} type="recipe" />

          {/* Bottom Action Area */}
          <div style={styles.footerActions}>
            <button onClick={onClose} style={styles.bottomCloseBtn}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 'clamp(5px, 2vw, 20px)',
    backdropFilter: 'blur(8px)',
    overflowX: 'hidden'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '1000px',
    maxHeight: '94vh',
    borderRadius: '30px',
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
    boxSizing: 'border-box'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  imageWrapper: { position: 'relative', width: '100%', height: 'min(400px, 40vh)' },
  heroImage: { width: '100%', height: '100%', objectFit: 'cover' },
  imageOverlay: { position: 'absolute', top: '20px', left: '20px' },
  regionBadge: { background: '#E2725B', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' },
  bodyContent: { padding: 'clamp(20px, 5vw, 40px)', width: '100%', boxSizing: 'border-box' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: 'clamp(1.6rem, 7vw, 2.8rem)', margin: 0, fontFamily: 'Playfair Display, serif', color: '#1A120B', lineHeight: '1.2' },
  locationText: { color: '#E2725B', fontWeight: 'bold', fontSize: '0.9rem' },
  description: { color: '#666', fontSize: '1rem', lineHeight: '1.6', marginBottom: '25px' },
  infoBar: { display: 'flex', gap: '20px', marginBottom: '30px', background: '#FDFCFB', padding: '15px', borderRadius: '20px', border: '1px solid #F0EBE3', flexWrap: 'wrap' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBg: { background: '#fff', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  infoLabel: { display: 'block', color: '#888', fontWeight: 'bold', fontSize: '0.6rem' },
  infoValue: { color: '#5C4033', fontSize: '0.95rem' },
  divider: { border: 'none', borderTop: '1px solid #EEE', margin: '30px 0' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', width: '100%' },
  sectionHeader: { fontSize: '1.4rem', marginBottom: '20px', fontFamily: 'Playfair Display, serif', color: '#1A120B', borderBottom: '3px solid #E2725B', display: 'inline-block', paddingBottom: '8px' },
  ingredientList: { listStyle: 'none', padding: 0, margin: 0 },
  ingredientItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F5F5F5' },
  bullet: { width: '6px', height: '6px', borderRadius: '50%', background: '#E2725B', flexShrink: 0 },
  ingText: { fontSize: '1rem', color: '#444' },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  stepBox: { display: 'flex', gap: '15px' },
  stepNumber: { background: '#5C4033', color: '#fff', borderRadius: '10px', minWidth: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 },
  stepText: { margin: 0, lineHeight: '1.6', fontSize: '1rem', color: '#333' },
  emptyText: { opacity: 0.5, fontStyle: 'italic' },
  footerActions: { marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #EEE', textAlign: 'center' },
  bottomCloseBtn: {
    background: '#5C4033',
    color: '#fff',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    width: '100%',
    maxWidth: '300px'
  },
  headerDownloadBtn: {
    background: 'rgba(255,255,255,0.9)',
    color: '#5C4033',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginLeft: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(5px)'
  }
};