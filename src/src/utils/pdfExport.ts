// PDF export helpers built on html2canvas + jspdf, with bulk ZIP support via jszip.
// Used by ReportCardsPage to export the rendered DynamicReportCard (#dynamic-report-card).
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

// A4 portrait dimensions in millimetres.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

interface CaptureOptions {
  scale?: number;
}

/** Render a DOM element to a canvas suitable for embedding in a PDF. */
async function elementToCanvas(el: HTMLElement, opts: CaptureOptions = {}): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale: opts.scale ?? 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: el.scrollWidth,
  });
}

/**
 * Add a canvas to a jsPDF document, scaling to A4 width and slicing into
 * multiple pages when the content is taller than one page.
 */
function addCanvasPaged(pdf: jsPDF, canvas: HTMLCanvasElement, isFirstPage: boolean) {
  const imgWidthMm = A4_WIDTH_MM;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  if (!isFirstPage) pdf.addPage();

  if (imgHeightMm <= A4_HEIGHT_MM) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    return;
  }

  // Content taller than a page: shift the image up page by page.
  let heightLeft = imgHeightMm;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
  heightLeft -= A4_HEIGHT_MM;
  while (heightLeft > 0) {
    position -= A4_HEIGHT_MM;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= A4_HEIGHT_MM;
  }
}

/** Build a single-element jsPDF (multi-page A4). */
export async function elementToPdf(el: HTMLElement, opts: CaptureOptions = {}): Promise<jsPDF> {
  const canvas = await elementToCanvas(el, opts);
  const pdf = new jsPDF('p', 'mm', 'a4');
  addCanvasPaged(pdf, canvas, true);
  return pdf;
}

/** Capture an element and trigger a browser download of the PDF. */
export async function downloadElementPdf(el: HTMLElement, filename: string): Promise<void> {
  const pdf = await elementToPdf(el);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export interface BulkPdfItem {
  /** Filename for this item's PDF inside the ZIP (without extension). */
  name: string;
}

/**
 * Render a list of items to individual PDFs and bundle them into a ZIP.
 *
 * `mountAndWait(item)` must render the target element off-screen, wait until it
 * is fully ready, and resolve with the element to capture (the shared
 * #dynamic-report-card node). Items are processed sequentially to avoid
 * duplicate DOM ids and concurrent data fetches.
 */
export async function reportsToZip<T extends BulkPdfItem>(
  items: T[],
  mountAndWait: (item: T) => Promise<HTMLElement>,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const el = await mountAndWait(item);
    const pdf = await elementToPdf(el);
    const blob = pdf.output('blob');

    // Ensure unique filenames within the archive.
    let base = sanitizeFilename(item.name) || `report_${i + 1}`;
    let candidate = `${base}.pdf`;
    let n = 2;
    while (usedNames.has(candidate)) {
      candidate = `${base}_${n}.pdf`;
      n++;
    }
    usedNames.add(candidate);

    zip.file(candidate, blob);
    onProgress?.(i + 1, items.length);
  }

  return zip.generateAsync({ type: 'blob' });
}

/** Trigger a browser download of an arbitrary blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 120);
}
