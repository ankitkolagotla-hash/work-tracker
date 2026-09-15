import { recognizeImageText } from './actOcr';

/**
 * Client-side text extraction for the Smart Intake drawer's file dropzone.
 * Every format here decodes entirely in the browser — nothing is uploaded
 * anywhere — using the same "load the heavy engine lazily" pattern already
 * established for Tesseract OCR in lib/actOcr.ts.
 */

const XML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

function decodeXmlEntities(text: string): string {
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g, (m) => XML_ENTITIES[m]);
}

/** Regex-based .docx text pull: walks word/document.xml in order, emitting each <w:t> run and a newline per </w:p>. */
function extractDocxXmlText(xml: string): string {
  const RUN_OR_PARA_RE = /<w:t[^>]*>([\s\S]*?)<\/w:t>|<\/w:p>/g;
  let out = '';
  let match: RegExpExecArray | null;
  while ((match = RUN_OR_PARA_RE.exec(xml)) !== null) {
    out += match[1] !== undefined ? decodeXmlEntities(match[1]) : '\n';
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(pageText);
  }
  return pages.join('\n\n').trim();
}

async function extractDocxText(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const docXml = zip.file('word/document.xml');
  if (!docXml) throw new Error('This .docx file has no readable document body.');
  const xml = await docXml.async('string');
  return extractDocxXmlText(xml);
}

function extractPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file.'));
    reader.readAsText(file);
  });
}

/**
 * Extracts plain text from a dropped/picked file: .txt reads directly,
 * .pdf via pdfjs-dist, .docx via a lightweight regex pull over its XML, and
 * images via the existing Tesseract OCR worker. Throws on anything else.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (file.type.startsWith('image/')) return recognizeImageText(file);
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return extractPdfText(file);
  if (name.endsWith('.docx')) return extractDocxText(file);
  if (name.endsWith('.txt') || file.type.startsWith('text/')) return extractPlainText(file);

  throw new Error('Unsupported file type — use .pdf, .txt, .docx, or an image.');
}
