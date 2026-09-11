export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // sigue al fallback
  }
  // Fallback: textarea oculto + execCommand('copy'), para contextos sin
  // Clipboard API (http no seguro, navegadores viejos, iframes sin permiso)
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',', 2);
  const mimeType = header.match(/^data:([^;]+)/)?.[1] ?? 'image/png';
  const binary = atob(encoded ?? '');
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function copyImageDataUrl(dataUrl: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({
        'image/png': dataUrlToBlob(dataUrl),
      })]);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function copyPromptQueue(entries: PromptEntry[]): Promise<boolean> {
  const text = formatQueueForClipboard(entries);
  const html = formatQueueForClipboardHTML(entries);
  const hasAttachments = entries.some((entry) => (entry.attachments?.length ?? 0) > 0);
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      const firstImage = entries.flatMap((entry) => entry.attachments ?? [])[0];
      const clipboardData: Record<string, Blob> = {};
      // Some consumers ignore <img> inside text/html but do accept a native
      // image clipboard item. Include the first capture in that format too.
      if (firstImage) {
        const response = await fetch(firstImage.dataUrl);
        clipboardData['image/png'] = await response.blob();
      }
      clipboardData['text/plain'] = new Blob([text], { type: 'text/plain' });
      clipboardData['text/html'] = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem(clipboardData)]);
      return true;
    }
  } catch {
    // Do not silently downgrade a visual prompt to text: the caller clears
    // the queue only when this function returns true.
    if (hasAttachments) return false;
  }
  if (hasAttachments) return false;
  return copyText(text);
}
import type { PromptEntry } from './types';
import { formatQueueForClipboard, formatQueueForClipboardHTML } from './promptFormat';
