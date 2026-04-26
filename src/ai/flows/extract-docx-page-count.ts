'use server';

import { z } from 'zod';

const ExtractDocxPageCountSchema = z.object({
  fileUrl: z.string().url(),
});

const MAX_DOCX_BYTES = 20 * 1024 * 1024;

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host.endsWith('.localhost') || host === 'metadata.google.internal') {
    return true;
  }

  if (host === '::1' || host === '[::1]') {
    return true;
  }

  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;

  const [a, b] = octets;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  return false;
}

function extractPositiveTagInt(xml: string | null, tagName: string): number | null {
  if (!xml) return null;
  const match = xml.match(new RegExp(`<${tagName}>(\\d+)</${tagName}>`, 'i'));
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function calculateFromDocumentXml(documentXml: string | null): number | null {
  if (!documentXml) return null;

  const renderedBreaks = (documentXml.match(/<w:lastRenderedPageBreak\b/g) || []).length;
  const explicitBreaks = (documentXml.match(/<w:br\b[^>]*w:type=(["'])page\1[^>]*\/?>/g) || []).length;

  let pages: number | null = null;
  if (renderedBreaks > 0) {
    pages = renderedBreaks + 1;
  }
  if (explicitBreaks > 0) {
    pages = Math.max(pages ?? 0, explicitBreaks + 1);
  }

  return pages;
}

export async function extractDocxPageCount(input: { fileUrl: string }): Promise<number | null> {
  const parsedInput = ExtractDocxPageCountSchema.safeParse(input);
  if (!parsedInput.success) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(parsedInput.data.fileUrl);
  } catch {
    return null;
  }

  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    return null;
  }

  if (isPrivateHost(parsedUrl.hostname)) {
    return null;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > MAX_DOCX_BYTES) {
        return null;
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_DOCX_BYTES) {
      return null;
    }

    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return null;
    }

    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(buffer);

    const appXmlEntry = zip.getEntry('docProps/app.xml');
    const appXml = appXmlEntry ? zip.readAsText(appXmlEntry, 'utf8') : null;
    const appPages = extractPositiveTagInt(appXml, 'Pages');
    if (appPages) {
      return appPages;
    }

    const documentXmlEntry = zip.getEntry('word/document.xml');
    const documentXml = documentXmlEntry ? zip.readAsText(documentXmlEntry, 'utf8') : null;
    const xmlPages = calculateFromDocumentXml(documentXml);
    if (xmlPages) {
      return xmlPages;
    }

    const wordCount = extractPositiveTagInt(appXml, 'Words');
    if (wordCount) {
      return Math.max(1, Math.ceil(wordCount / 500));
    }

    return null;
  } catch (error) {
    console.warn('[DOCX Page Count] Extraction failed:', error);
    return null;
  }
}

