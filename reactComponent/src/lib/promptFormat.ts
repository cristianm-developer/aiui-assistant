import type { PromptEntry, ViewportInfo } from './types';
import type { TargetContext } from './dom';

export function getPromptRoute(url: string): string {
  try {
    const parsed = new URL(url, 'http://aiui-assistant.local');
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}

export function getPromptOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

export function formatPrompt(
  targetId: string,
  url: string,
  userText: string,
  prePrompt?: string,
  reference?: string,
  viewport?: ViewportInfo,
  routeOverride?: string,
  visualCapturePath?: string,
): string {
  const route = routeOverride?.trim() || getPromptRoute(url);
  const origin = getPromptOrigin(url);
  const normalizedReference = normalizeReferenceForPrompt(reference);
  const originLine = origin ? `Origin: ${origin}\n` : '';
  const routeLine = `Route: ${route}\n`;
  const viewportLine = viewport ? `Viewport: ${viewport.width}x${viewport.height}px (DPR ${viewport.devicePixelRatio})\n` : '';
  const referenceBlock = normalizedReference ? `Reference:\n${normalizedReference}\n\n` : '';
  const captureLine = visualCapturePath ? `\nVisual capture file: ${visualCapturePath}` : '';
  const base = `${originLine}${routeLine}${viewportLine}${referenceBlock}Prompt:\nAbout ${targetId}: ${userText}${captureLine}`;
  const trimmedPrePrompt = prePrompt?.trim();
  return trimmedPrePrompt ? `${trimmedPrePrompt}\n\n${base}` : base;
}

function normalizeReferenceForPrompt(reference?: string): string {
  return (reference ?? '')
    .split(/\r?\n/)
    .filter((line) => !/^\s*(Origin|Route):\s*/i.test(line))
    .join('\n')
    .trim();
}

/** Keeps one target header while accumulating its individual requests. */
export function mergePromptRequests(existing: string, incoming: string, targetId: string, _route: string): string {
  const markers = [`Prompt:\nAbout ${targetId}: `, `About ${targetId}: `, `About ${targetId} on route ${_route}: `];
  const existingMarker = markers.find((candidate) => existing.includes(candidate));
  const incomingMarker = markers.find((candidate) => incoming.includes(candidate));
  if (!existingMarker || !incomingMarker) return `${existing}\n\n${incoming}`;
  const existingIndex = existing.indexOf(existingMarker);
  const incomingIndex = incoming.indexOf(incomingMarker);

  const prefix = existing.slice(0, existingIndex + existingMarker.length).replace(/ on route [^:]+:/, ':');
  const existingBody = existing.slice(existingIndex + existingMarker.length);
  const incomingBody = incoming.slice(incomingIndex + incomingMarker.length);
  const groupedBody = existingBody.startsWith('- ')
    ? `${existingBody}\n- ${incomingBody}`
    : `- ${existingBody}\n- ${incomingBody}`;
  return `${prefix}${groupedBody}`;
}

export type ModelPromptPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/** Converts a queued prompt into multimodal content for a vision-capable model. */
export function formatPromptForModel(entry: PromptEntry): ModelPromptPart[] {
  return [
    { type: 'text', text: entry.text },
    ...(entry.attachments ?? []).map((attachment) => ({
      type: 'image_url' as const,
      image_url: { url: attachment.dataUrl },
    })),
  ];
}

export function formatTargetReference(
  targetId: string,
  context: TargetContext,
  url: string,
  targetType?: string,
): string {
  const lines = [
    `Frontend reference: ${targetId}`,
    ...(targetType ? [`Target type: ${targetType}`] : []),
    `HTML element: ${context.tagName}`,
    `Route: ${context.route || new URL(url).pathname}`,
  ];
  if (context.componentName) lines.push(`Component: ${context.componentName}`);
  if (context.sourceFile) lines.push(`Source: ${context.sourceFile}${context.sourceLine ? `:${context.sourceLine}` : ''}`);
  if (context.text) lines.push(`Text: ${context.text}`);
  if (context.classes.length) lines.push(`Classes: ${context.classes.join(' ')}`);
  const semantic = Object.entries(context.semantic)
    .filter(([key, value]) => key !== 'states' && value)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  if (semantic) lines.push(`Semantic: ${semantic}`);
  const states = Object.entries(context.semantic.states).filter(([, value]) => value).map(([key]) => key).join(', ');
  if (states) lines.push(`States: ${states}`);
  if (context.parent) {
    const parentId = context.parent.targetId ?? context.parent.id ?? context.parent.tagName;
    lines.push(`Visual parent: ${parentId}${context.parent.type ? ` (${context.parent.type})` : ''}`);
    if (context.parent.componentKind) lines.push(`Parent component: ${context.parent.componentKind}`);
    if (context.parent.classes.length) lines.push(`Parent classes: ${context.parent.classes.join(' ')}`);
  }
  const attrs = Object.entries(context.attributes).map(([key, value]) => `${key}="${value}"`).join(' ');
  if (attrs) lines.push(`Attributes: ${attrs}`);
  const styles = Object.entries(context.styles).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join('; ');
  if (styles) lines.push(`Styles: ${styles}`);
  return lines.join('\n');
}

export function formatTargetReferenceJSON(targetId: string, targetType: string, context: TargetContext, url: string): string {
  return JSON.stringify({
    reference: targetId,
    targetType,
    url,
    context,
  }, null, 2);
}

export function formatQueueForClipboard(entries: PromptEntry[]): string {
  return formatQueueGroups(entries, (group, bodies) => [
    group.prefix,
    '## Context',
    `- **Origin:** \`${escapeMarkdownInline(group.origin)}\``,
    `- **Route:** \`${escapeMarkdownInline(group.route)}\``,
    ...(group.viewport ? [`- **Viewport:** \`${escapeMarkdownInline(group.viewport)}\``] : []),
    '',
    bodies.map(formatPromptBodyAsMarkdown).join('\n\n---\n\n'),
  ].filter(Boolean).join('\n'));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] ?? character));
}

/** Rich clipboard representation so pasted prompts retain visual captures. */
export function formatQueueForClipboardHTML(entries: PromptEntry[]): string {
  return formatQueueGroups(entries, (group, bodies) => {
    const header = [group.prefix, `Origin: ${group.origin}`, `Route: ${group.route}`, group.viewport ? `Viewport: ${group.viewport}` : '']
      .filter(Boolean).map(escapeHtml).join('<br>');
    const images = group.entries.flatMap((entry) => entry.attachments ?? [])
      .map((attachment) => `<p><img src="${escapeHtml(attachment.dataUrl)}" alt="Visual capture"></p>`)
      .join('');
    return `<div>${header}<br><br>${bodies.map((body) => escapeHtml(body).replace(/\n/g, '<br>')).join('<br><br>')}${images}</div>`;
  });
}

interface PromptQueueGroup {
  origin: string;
  route: string;
  viewport: string;
  prefix: string;
  entries: PromptEntry[];
}

function formatQueueGroups(
  entries: PromptEntry[],
  render: (group: PromptQueueGroup, bodies: string[]) => string,
): string {
  const groups = new Map<string, PromptQueueGroup>();
  entries.forEach((entry) => {
    const origin = getPromptOrigin(entry.url) || 'unknown-origin';
    const route = getPromptRoute(entry.url);
    const viewport = entry.viewport
      ? `${entry.viewport.width}x${entry.viewport.height}px (DPR ${entry.viewport.devicePixelRatio})`
      : '';
    const key = `${origin}|${route}|${viewport}`;
    const group = groups.get(key) ?? { origin, route, viewport, prefix: extractPromptPrefix(entry.text), entries: [] };
    group.entries.push(entry);
    groups.set(key, group);
  });

  return [...groups.values()].map((group) => {
    const bodies = group.entries.map((entry) => {
      return extractPromptBody(entry.text, entry.targetId, group.route);
    });
    return render(group, bodies);
  }).join('\n\n---\n\n');
}

function extractPromptPrefix(text: string): string {
  const originIndex = text.indexOf('Origin: ');
  return originIndex >= 0 ? text.slice(0, originIndex).trim() : '';
}

function extractPromptBody(text: string, targetId: string, route: string): string {
  const promptMarker = `Prompt:\nAbout ${targetId}: `;
  const promptIndex = text.indexOf(promptMarker);
  if (promptIndex >= 0) {
    const referenceIndex = text.lastIndexOf('Reference:\n', promptIndex);
    return text.slice(referenceIndex >= 0 ? referenceIndex : promptIndex);
  }
  const modernMarker = `About ${targetId}: `;
  const modernIndex = text.indexOf(modernMarker);
  if (modernIndex >= 0) return text.slice(modernIndex);
  const legacyMarker = `About ${targetId} on route ${route}: `;
  const legacyIndex = text.indexOf(legacyMarker);
  if (legacyIndex >= 0) return `${modernMarker}${text.slice(legacyIndex + legacyMarker.length)}`;
  return text;
}

function escapeMarkdownInline(value: string): string {
  return value.replace(/`/g, '\\`');
}

function formatPromptBodyAsMarkdown(body: string): string {
  const promptIndex = body.indexOf('Prompt:\n');
  const referenceIndex = body.indexOf('Reference:\n');
  const sections: string[] = [];

  if (referenceIndex >= 0 && (promptIndex < 0 || referenceIndex < promptIndex)) {
    const referenceEnd = promptIndex >= 0 ? promptIndex : body.length;
    const reference = body.slice(referenceIndex + 'Reference:\n'.length, referenceEnd).trim();
    if (reference) sections.push(`### Reference\n${reference}`);
  }

  if (promptIndex >= 0) {
    const prompt = body.slice(promptIndex + 'Prompt:\n'.length).trim();
    sections.push(formatPromptSection(prompt));
  } else {
    sections.push(formatPromptSection(body));
  }

  return sections.join('\n\n');
}

function formatPromptSection(prompt: string): string {
  const match = prompt.match(/^About ([^:]+):\s*([\s\S]*)$/);
  if (!match) return `### Prompt\n${prompt}`;
  const target = match[1].trim();
  const content = match[2].trim().replace(
    /\nVisual capture file:\s*(.+)$/m,
    '\n- **Visual capture file:** `$1`',
  );
  return `### Prompt — \`${escapeMarkdownInline(target)}\`\n${content}`;
}
