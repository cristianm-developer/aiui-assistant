import html2canvas from 'html2canvas';

/** Create a self-contained PNG snapshot of a DOM target when the browser allows it. */
export async function captureElementImage(el: Element): Promise<string | null> {
  if (!(el instanceof HTMLElement) || typeof window === 'undefined') return null;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 0,
      logging: false,
      scale: window.devicePixelRatio || 1,
    });
    return canvas.toDataURL('image/png');
  } catch {
    // Keep the foreignObject fallback for browsers or DOM content that
    // html2canvas cannot render.
  }

  const clone = el.cloneNode(true) as HTMLElement;
  const sourceNodes = [el, ...Array.from(el.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];
  const properties = ['box-sizing', 'display', 'position', 'width', 'height', 'padding', 'margin', 'color', 'background', 'border', 'border-radius', 'font', 'line-height', 'text-align', 'white-space', 'gap', 'align-items', 'justify-content', 'overflow'];

  sourceNodes.forEach((source, index) => {
    const destination = cloneNodes[index] as HTMLElement | undefined;
    if (!destination || !(source instanceof HTMLElement)) return;
    const computed = window.getComputedStyle(source);
    properties.forEach((property) => destination.style.setProperty(property, computed.getPropertyValue(property)));
  });
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.margin = '0';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${new XMLSerializer().serializeToString(clone)}</div></foreignObject></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo renderizar la captura visual'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(rect.width * window.devicePixelRatio);
    canvas.height = Math.ceil(rect.height * window.devicePixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    context.drawImage(image, 0, 0, rect.width, rect.height);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Downloads a capture through the browser's configured local Downloads folder.
 * Browsers do not expose the absolute Windows path to page JavaScript, so the
 * returned value is intentionally a portable path relative to Downloads.
 */
export function saveCaptureToDownloads(dataUrl: string, targetId: string): string {
  const safeTarget = targetId.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'target';
  const fileName = `aiui-capture-${safeTarget}-${Date.now()}.png`;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return `Downloads/${fileName}`;
}
