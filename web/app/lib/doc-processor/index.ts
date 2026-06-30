/**
 * Document processing utilities for Agentbot agents.
 * Powered by MiMo-V2.5-Pro + Kingsoft Office integration.
 *
 * Supports: Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PDF
 */

export type DocumentFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'txt' | 'csv';

export interface DocumentMetadata {
  format: DocumentFormat;
  filename: string;
  size: number;
  pageCount?: number;
  wordCount?: number;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  tables?: TableData[];
  images?: ImageData[];
}

export interface TableData {
  name?: string;
  headers: string[];
  rows: string[][];
}

export interface ImageData {
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Extract text content from a document.
 * Uses MiMo-V2.5-Pro for intelligent extraction.
 */
export async function extractDocumentContent(
  file: Buffer,
  filename: string
): Promise<ExtractedContent> {
  const format = getDocumentFormat(filename);

  // In production, this would call MiMo-V2.5-Pro via OpenRouter
  // with Kingsoft Office integration for document parsing
  const content = await parseDocument(file, format);

  return {
    text: content.text,
    metadata: {
      format,
      filename,
      size: file.length,
      pageCount: content.pageCount,
      wordCount: content.text.split(/\s+/).length,
    },
    tables: content.tables,
    images: content.images,
  };
}

/**
 * Convert document to a format suitable for agent processing.
 */
export async function prepareForAgent(
  content: ExtractedContent,
  maxTokens: number = 4000
): Promise<string> {
  const { text, metadata, tables } = content;

  let prepared = `Document: ${metadata.filename}\n`;
  prepared += `Format: ${metadata.format.toUpperCase()}\n`;
  prepared += `Words: ${metadata.wordCount}\n\n`;

  // Truncate text to fit token limit
  const tokenEstimate = text.split(/\s+/).length * 1.3;
  if (tokenEstimate > maxTokens) {
    const truncatedWords = Math.floor(maxTokens / 1.3);
    prepared += text.split(/\s+/).slice(0, truncatedWords).join(' ') + '\n\n[Truncated]';
  } else {
    prepared += text;
  }

  // Add tables as formatted text
  if (tables && tables.length > 0) {
    prepared += '\n\n--- Tables ---\n';
    for (const table of tables) {
      if (table.name) prepared += `\n${table.name}:\n`;
      prepared += table.headers.join(' | ') + '\n';
      prepared += table.headers.map(() => '---').join(' | ') + '\n';
      for (const row of table.rows) {
        prepared += row.join(' | ') + '\n';
      }
      prepared += '\n';
    }
  }

  return prepared;
}

function getDocumentFormat(filename: string): DocumentFormat {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const formatMap: Record<string, DocumentFormat> = {
    docx: 'docx',
    doc: 'docx',
    xlsx: 'xlsx',
    xls: 'xlsx',
    pptx: 'pptx',
    ppt: 'pptx',
    pdf: 'pdf',
    txt: 'txt',
    csv: 'csv',
  };
  return formatMap[ext] || 'txt';
}

async function parseDocument(
  file: Buffer,
  format: DocumentFormat
): Promise<{ text: string; pageCount?: number; tables?: TableData[]; images?: ImageData[] }> {
  // In production, this would use:
  // - MiMo-V2.5-Pro for intelligent content extraction
  // - Kingsoft Office for format-specific parsing
  // - OCR for scanned PDFs

  // Placeholder implementation
  return {
    text: `[Document content extracted from ${format.toUpperCase()} file]`,
    pageCount: 1,
    tables: [],
    images: [],
  };
}
