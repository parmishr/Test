import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib';

// Helper to fetch and convert image data URL to ArrayBuffer
async function fetchImageArrayBuffer(imageDataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(imageDataUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

export interface SignaturePosition {
  x: number;
  y: number;
}

export interface ViewerPageInfo {
  width: number; // Displayed width of the PDF page in the viewer (pixels)
  height: number; // Displayed height of the PDF page in the viewer (pixels)
}


export async function applySignatureToPdf(
  originalPdfFile: File,
  signatureImageDataUrl: string,
  signaturePositionInViewer: SignaturePosition,
  viewerPageInfo: ViewerPageInfo, // Dimensions of the PDF page as rendered in the viewer
  signatureDisplaySize: { width: number, height: number } // Size of signature image as displayed
): Promise<Uint8Array | null> {
  try {
    const pdfArrayBuffer = await originalPdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

    const signatureImageArrayBuffer = await fetchImageArrayBuffer(signatureImageDataUrl);
    const signatureImage = await pdfDoc.embedPng(signatureImageArrayBuffer);

    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      console.error('PDF has no pages.');
      return null;
    }
    const firstPage = pages[0]; // Apply to the first page

    // PDF page dimensions (in PDF points)
    const { width: pdfPageWidth, height: pdfPageHeight } = firstPage.getMediaBox();

    // --- Coordinate Translation ---
    // 1. Calculate scaling factors
    // Scale factor from viewer display size to PDF page size
    const scaleX = pdfPageWidth / viewerPageInfo.width;
    const scaleY = pdfPageHeight / viewerPageInfo.height;

    // 2. Scale signature dimensions from display size to PDF units
    // We use an average scale or maintain aspect ratio. Let's use average scale for simplicity here,
    // or better, scale width and height independently.
    const signatureWidthInPdfPoints = signatureDisplaySize.width * scaleX;
    const signatureHeightInPdfPoints = signatureDisplaySize.height * scaleY;
    
    // 3. Transform (x, y) coordinates
    // Viewer (x, y) is from top-left of the viewer's PDF area.
    // PDF (x, y) is from bottom-left of the PDF page.
    let pdfX = signaturePositionInViewer.x * scaleX;
    let pdfY = pdfPageHeight - (signaturePositionInViewer.y * scaleY) - signatureHeightInPdfPoints;
    // The subtraction of signatureHeightInPdfPoints for pdfY is because page.drawImage draws
    // the image from its bottom-left corner. So, we want the y-coordinate of the bottom-left
    // corner of the image on the PDF page.

    // --- Sanity Checks/Clamping (optional but good for robustness) ---
    // Ensure signature is not drawn completely outside the page
    pdfX = Math.max(0, Math.min(pdfX, pdfPageWidth - signatureWidthInPdfPoints));
    pdfY = Math.max(0, Math.min(pdfY, pdfPageHeight - signatureHeightInPdfPoints));
    
    // --- Draw the image ---
    firstPage.drawImage(signatureImage, {
      x: pdfX,
      y: pdfY,
      width: signatureWidthInPdfPoints,
      height: signatureHeightInPdfPoints,
      opacity: 0.9, // Example: slightly transparent
    });

    // Example: Add a small text note (optional)
    // const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // firstPage.drawText(`Signed at ${new Date().toLocaleTimeString()}`, {
    //   x: pdfX,
    //   y: pdfY - 10, // Slightly below the signature
    //   size: 8,
    //   font: helveticaFont,
    //   color: rgb(0.5, 0.5, 0.5),
    // });

    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;

  } catch (error) {
    console.error('Error applying signature to PDF:', error);
    return null;
  }
}
