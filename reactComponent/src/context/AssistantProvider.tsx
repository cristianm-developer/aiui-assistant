'use client';

import { useCallback, useEffect, useState } from 'react';
import { AssistantContext, type AssistantContextValue } from './AssistantContext';
import { readJSON, writeJSON } from '../lib/storage';
import { STORAGE_KEY_CONFIG, STORAGE_KEY_PROMPTS } from '../lib/constants';
import { DEFAULT_CONFIG, type AssistantConfig, type PromptEntry } from '../lib/types';
import { getPromptOrigin, getPromptRoute, mergePromptRequests } from '../lib/promptFormat';

function mergeConfig(stored: Partial<AssistantConfig> | null | undefined): AssistantConfig {
  // Merge campo por campo (no shallow spread) para tolerar configs viejas
  // guardadas antes de agregar un campo nuevo a capture/show — el campo
  // faltante debe tomar el default, no quedar undefined.
  return {
    active: stored?.active ?? DEFAULT_CONFIG.active,
    capture: {
      sections: stored?.capture?.sections ?? DEFAULT_CONFIG.capture.sections,
      components: stored?.capture?.components ?? DEFAULT_CONFIG.capture.components,
      wrappers: stored?.capture?.wrappers ?? DEFAULT_CONFIG.capture.wrappers,
      elements: stored?.capture?.elements ?? DEFAULT_CONFIG.capture.elements,
    },
    show: {
      sections: stored?.show?.sections ?? DEFAULT_CONFIG.show.sections,
      components: stored?.show?.components ?? DEFAULT_CONFIG.show.components,
      wrappers: stored?.show?.wrappers ?? DEFAULT_CONFIG.show.wrappers,
    },
  };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AssistantConfig>(() =>
    mergeConfig(readJSON<AssistantConfig>(STORAGE_KEY_CONFIG, DEFAULT_CONFIG))
  );
  const [prompts, setPrompts] = useState<PromptEntry[]>(() =>
    readJSON<PromptEntry[]>(STORAGE_KEY_PROMPTS, []).map((entry) => ({
      ...entry,
      // Entries saved before grouping counts existed represent one request.
      requestCount: entry.requestCount ?? 1,
    }))
  );

  useEffect(() => {
    writeJSON(STORAGE_KEY_CONFIG, config);
  }, [config]);

  useEffect(() => {
    writeJSON(STORAGE_KEY_PROMPTS, prompts);
  }, [prompts]);

  const toggleActive = useCallback(() => {
    setConfig((prev) => ({ ...prev, active: !prev.active }));
  }, []);

  const setActive = useCallback((value: boolean) => {
    setConfig((prev) => ({ ...prev, active: value }));
  }, []);

  const setCaptureFlag = useCallback((key: keyof AssistantConfig['capture'], value: boolean) => {
    setConfig((prev) => ({ ...prev, capture: { ...prev.capture, [key]: value } }));
  }, []);

  const setShowFlag = useCallback((key: keyof AssistantConfig['show'], value: boolean) => {
    setConfig((prev) => ({ ...prev, show: { ...prev.show, [key]: value } }));
  }, []);

  const addPrompt = useCallback((entry: Omit<PromptEntry, 'id' | 'createdAt'>) => {
    setPrompts((prev) => {
      const existing = prev.find((item) => item.targetId === entry.targetId && item.targetType === entry.targetType && getPromptOrigin(item.url) === getPromptOrigin(entry.url) && getPromptRoute(item.url) === getPromptRoute(entry.url));
      if (!existing) {
        return [...prev, { ...entry, id: generateId(), createdAt: Date.now(), requestCount: 1 }];
      }
      return prev.map((item) => item.id === existing.id
        ? {
            ...item,
            text: mergePromptRequests(item.text, entry.text, entry.targetId, getPromptRoute(entry.url)),
            attachments: [...(item.attachments ?? []), ...(entry.attachments ?? [])],
            requestCount: (item.requestCount ?? 1) + 1,
          }
        : item);
    });
  }, []);

  const clearPrompts = useCallback(() => {
    setPrompts([]);
  }, []);

  const value: AssistantContextValue = {
    config,
    prompts,
    toggleActive,
    setActive,
    setCaptureFlag,
    setShowFlag,
    addPrompt,
    clearPrompts,
  };

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
