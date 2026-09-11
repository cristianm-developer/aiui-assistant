import { describe, expect, it } from 'vitest';
import { formatPrompt, formatPromptForModel, formatQueueForClipboard, formatQueueForClipboardHTML, formatTargetReferenceJSON, mergePromptRequests } from './promptFormat';
import type { PromptEntry } from './types';

describe('formatPrompt', () => {
  it('arma el prompt base sin prePrompt', () => {
    expect(formatPrompt('hero/card[0]', 'https://x.com', 'hacelo más grande')).toBe(
      'Origin: https://x.com\nRoute: /\nPrompt:\nAbout hero/card[0]: hacelo más grande'
    );
  });

  it('antepone el prePrompt cuando viene definido', () => {
    const result = formatPrompt(
      'hero/card[0]',
      'https://x.com',
      'hacelo más grande',
      'Usa la skill frontend-component y la skill frontend-context.'
    );
    expect(result).toBe(
      'Usa la skill frontend-component y la skill frontend-context.\n\nOrigin: https://x.com\nRoute: /\nPrompt:\nAbout hero/card[0]: hacelo más grande'
    );
  });

  it('ignora un prePrompt vacío o solo espacios', () => {
    expect(formatPrompt('id', 'url', 'texto', '')).toBe('Route: /url\nPrompt:\nAbout id: texto');
    expect(formatPrompt('id', 'url', 'texto', '   ')).toBe('Route: /url\nPrompt:\nAbout id: texto');
  });

  it('incluye la ruta local de la captura guardada', () => {
    expect(formatPrompt('hero', 'https://x.com/', 'ajustar', undefined, undefined, undefined, '/', 'Downloads/aiui-capture-hero.png'))
      .toContain('Visual capture file: Downloads/aiui-capture-hero.png');
  });

  it('no repite origen ni ruta dentro de una referencia pegada', () => {
    const result = formatPrompt(
      'hero',
      'http://localhost:5173/',
      'revisar',
      undefined,
      'Frontend reference: cta-card\nOrigin: http://localhost:5173\nRoute: /\nComponent: CtaCard',
      undefined,
      '/',
    );
    expect(result).toContain('Origin: http://localhost:5173\nRoute: /\nReference:');
    expect(result).toContain('Frontend reference: cta-card\nComponent: CtaCard');
    expect(result).not.toContain('Reference:\nFrontend reference: cta-card\nOrigin:');
    expect(result).not.toContain('Component: CtaCard\nRoute: /');
  });

  it('mantiene la captura fuera del texto y la convierte en parte multimodal', () => {
    const entry: PromptEntry = {
      id: '1', targetId: 'card', targetType: 'component', url: 'url',
      text: formatPrompt('card', 'url', 'ajustar', undefined, undefined, { width: 390, height: 844, devicePixelRatio: 2 }), createdAt: 1,
      viewport: { width: 390, height: 844, devicePixelRatio: 2 },
      attachments: [{ type: 'image', mimeType: 'image/png', dataUrl: 'data:image/png;base64,abc' }],
    };
    expect(entry.text).not.toContain('base64');
    expect(entry.text).toContain('Viewport: 390x844px (DPR 2)');
    expect(formatPromptForModel(entry)).toEqual([
      { type: 'text', text: entry.text },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,abc' } },
    ]);
  });

  it('agrupa solicitudes sin repetir viewport ni cabecera del target', () => {
    const first = formatPrompt('hero-v2', 'http://localhost:4321/', 'primero', undefined, undefined, { width: 1905, height: 919, devicePixelRatio: 1 });
    const second = formatPrompt('hero-v2', 'http://localhost:4321/', 'segundo', undefined, undefined, { width: 1905, height: 919, devicePixelRatio: 1 });
    const grouped = mergePromptRequests(first, second, 'hero-v2', '/');
    expect(grouped.match(/Viewport:/g)).toHaveLength(1);
    expect(grouped.match(/About hero-v2:/g)).toHaveLength(1);
    expect(grouped).toContain('- primero\n- segundo');
  });
});

describe('formatQueueForClipboard', () => {
  it('junta los textos de la cola con doble salto de línea', () => {
    const entries: PromptEntry[] = [
      { id: '1', targetId: 'a', targetType: 'element', url: 'u', text: 'uno', createdAt: 1 },
      { id: '2', targetId: 'b', targetType: 'element', url: 'u', text: 'dos', createdAt: 2 },
    ];
    expect(formatQueueForClipboard(entries)).toContain('- **Origin:** `unknown-origin`');
    expect(formatQueueForClipboard(entries)).toContain('### Prompt\nuno');
    expect(formatQueueForClipboard(entries)).toContain('### Prompt\ndos');
  });

  it('indica en texto plano cuando hay una captura adjunta', () => {
    const entries: PromptEntry[] = [{
      id: '1', targetId: 'a', targetType: 'component', url: 'u', text: 'ajustar', createdAt: 1,
      attachments: [{ type: 'image', mimeType: 'image/png', dataUrl: 'data:image/png;base64,abc' }],
    }];
    expect(formatQueueForClipboard(entries)).not.toContain('Visual capture attached');
  });

  it('incluye capturas en el formato HTML del portapapeles', () => {
    const entries: PromptEntry[] = [{
      id: '1', targetId: 'a', targetType: 'component', url: 'u', text: 'ajustar', createdAt: 1,
      attachments: [{ type: 'image', mimeType: 'image/png', dataUrl: 'data:image/png;base64,abc' }],
    }];
    expect(formatQueueForClipboardHTML(entries)).toContain('<img src="data:image/png;base64,abc"');
  });

  it('agrupa por origen y ruta sin repetir el origen en cada prompt', () => {
    const entries: PromptEntry[] = [
      { id: '1', targetId: 'hero', targetType: 'component', url: 'http://localhost:5173/', text: 'Origin: http://localhost:5173\nRoute: /\nAbout hero: uno', createdAt: 1 },
      { id: '2', targetId: 'footer', targetType: 'component', url: 'http://localhost:5173/', text: 'Origin: http://localhost:5173\nRoute: /\nAbout footer: dos', createdAt: 2 },
      { id: '3', targetId: 'hero', targetType: 'component', url: 'http://localhost:5173/about', text: 'Origin: http://localhost:5173\nRoute: /about\nAbout hero: tres', createdAt: 3 },
    ];
    const result = formatQueueForClipboard(entries);
    expect(result.match(/\*\*Origin:\*\* `http:\/\/localhost:5173`/g) ?? []).toHaveLength(2);
    expect(result).toContain('- **Route:** `/`');
    expect(result).toContain('### Prompt — `hero`\nuno\n\n---\n\n### Prompt — `footer`\ndos');
    expect(result).toContain('- **Route:** `/about`');
    expect(result).toContain('\n\n---\n\n## Context');
  });
});

describe('formatTargetReferenceJSON', () => {
  it('serializa tipo lógico y contexto para agentes', () => {
    const result = JSON.parse(formatTargetReferenceJSON('hero-title', 'component', {
      route: '/home',
      tagName: 'h1',
      text: 'Hello',
      classes: ['title'],
      attributes: { 'data-component-id': 'hero-title' },
      styles: { color: 'red' },
      semantic: { accessibleName: 'Hello', states: {} },
    }, 'https://example.com/home'));
    expect(result).toMatchObject({ reference: 'hero-title', targetType: 'component', context: { route: '/home' } });
  });
});
