import jsPDF from 'jspdf';

/**
 * Robustly generates a PDF for a recipe, handling multi-page content and images.
 */
export const generateRecipePDF = async (recipe) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = 20;

  // 1. Header (Title & Region)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(70, 32, 9); // #462009
  
  const titleLines = doc.splitTextToSize(recipe.title, contentWidth);
  doc.text(titleLines, margin, currentY);
  currentY += (titleLines.length * 7) + 5;

  doc.setFontSize(10);
  doc.setTextColor(226, 114, 91); // #E2725B
  doc.text(recipe.categories?.region?.toUpperCase() || 'HERITAGE RECIPE', margin, currentY);
  currentY += 10;

  // 2. Image (If exists)
  if (recipe.image_url) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = recipe.image_url;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const imgWidth = contentWidth;
      const imgHeight = (img.height * imgWidth) / img.width;
      const displayHeight = Math.min(imgHeight, 80); // Cap height

      doc.addImage(img, 'JPEG', margin, currentY, imgWidth, displayHeight);
      currentY += displayHeight + 15;
    } catch (e) {
      console.warn("Could not load image for PDF:", e);
      currentY += 5;
    }
  }

  // 3. Description
  if (recipe.short_description || recipe.detailed_description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const desc = recipe.detailed_description || recipe.short_description;
    const descLines = doc.splitTextToSize(desc, contentWidth);
    doc.text(descLines, margin, currentY);
    currentY += (descLines.length * 6) + 15;
  }

  // Helper for adding sections safely across pages
  const checkNewPage = (heightNeeded) => {
    if (currentY + heightNeeded > 270) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  // 4. Ingredients
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(70, 32, 9);
  doc.text("Ingredients", margin, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  ingredients.forEach(ing => {
    const text = typeof ing === 'object' 
      ? `• ${ing.amount || ''} ${ing.unit || ''} ${ing.item || ''}`.trim()
      : `• ${ing}`;
    
    const lines = doc.splitTextToSize(text, contentWidth - 5);
    checkNewPage(lines.length * 6);
    doc.text(lines, margin + 2, currentY);
    currentY += (lines.length * 6);
  });
  currentY += 10;

  // 5. Method (Steps)
  checkNewPage(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(70, 32, 9);
  doc.text("Preparation Method", margin, currentY);
  currentY += 10;

  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  steps.forEach((step, index) => {
    const stepText = typeof step === 'object' ? (step.description || step.instruction) : step;
    const fullStepText = `${index + 1}. ${stepText}`;
    const lines = doc.splitTextToSize(fullStepText, contentWidth);
    
    checkNewPage(lines.length * 6);
    doc.text(lines, margin, currentY);
    currentY += (lines.length * 6) + 4;
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`AfriFood Heritage Feed - Page ${i} of ${pageCount}`, margin, 285);
  }

  doc.save(`${recipe.title.replace(/\s+/g, '_')}_Recipe.pdf`);
};
