'use client';

import { useEffect, useRef, useState } from 'react';
import type { TrackedTarget } from '../../lib/dom';
import type { IaFraConfig } from '../../config/types';
import { formatPrompt, formatTargetReference, formatTargetReferenceJSON } from '../../lib/promptFormat';
import { copyImageDataUrl, copyText } from '../../lib/clipboard';
import { getTargetContext } from '../../lib/dom';
import { VariantSizePicker } from './VariantSizePicker';
import { ThemePicker } from './ThemePicker';
import { captureElementImage, saveCaptureToDownloads } from '../../lib/visualCapture';
import type { PromptImageAttachment, ViewportInfo } from '../../lib/types';

export interface PromptSavePayload {
  text: string;
  visualCapture?: PromptImageAttachment;
  viewport: ViewportInfo;
}

export interface PromptModalProps {
  target: TrackedTarget;
  definitions?: IaFraConfig;
  onClose: () => void;
  onSave: (payload: PromptSavePayload) => void;
}

export function PromptModal({ target, definitions, onClose, onSave }: PromptModalProps) {
  const [text, setText] = useState('');
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState<'text' | 'json' | null>(null);
  const [includeCapture, setIncludeCapture] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function appendSentence(current: string, sentence: string): string {
    const trimmed = current.trimEnd();
    return trimmed.length > 0 ? `${trimmed}\n${sentence}` : sentence;
  }

  function handlePick(sentence: string) {
    setText((prev) => appendSentence(prev, sentence));
    // foco + cursor al final, para las oraciones "abiertas" que terminan en espacio
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  const matchedComponent = definitions?.components?.find((c) => c.kind === target.kind);

  async function handleCaptureToggle(checked: boolean) {
    setIncludeCapture(checked);
    setCaptureError(false);
    setImageCopied(false);
    if (!checked) {
      setCapturedImage(null);
      return;
    }
    setCapturing(true);
    const image = await captureElementImage(target.el);
    setCapturing(false);
    setCapturedImage(image);
    setCaptureError(!image);
  }

  async function handleSubmit() {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    setCapturing(includeCapture);
    const visualCapture = includeCapture
      ? (capturedImage ?? await captureElementImage(target.el))
      : undefined;
    setCapturing(false);
    if (includeCapture && !visualCapture) {
      setCaptureError(true);
      return;
    }
    setCaptureError(false);
    const targetContext = getTargetContext(target.el, definitions?.referenceAttributes, definitions?.includeSemanticState ?? true);
    const viewport = {
      width: Math.round(window.visualViewport?.width ?? window.innerWidth),
      height: Math.round(window.visualViewport?.height ?? window.innerHeight),
      devicePixelRatio: window.devicePixelRatio || 1,
    } satisfies ViewportInfo;
    const visualCapturePath = visualCapture
      ? saveCaptureToDownloads(visualCapture, target.id)
      : undefined;
    const fullText = formatPrompt(
      target.id,
      window.location.href,
      trimmed,
      definitions?.prePrompt,
      reference.trim(),
      viewport,
      targetContext.route,
      visualCapturePath,
    );
    onSave({
      text: fullText,
      visualCapture: visualCapture ? { type: 'image', mimeType: 'image/png', dataUrl: visualCapture } : undefined,
      viewport,
    });
  }

  async function handleCopyReference() {
    const context = getTargetContext(target.el, definitions?.referenceAttributes, definitions?.includeSemanticState ?? true);
    const ok = await copyText(formatTargetReference(target.id, context, window.location.href, target.type));
    if (ok) {
      setCopied('text');
      setTimeout(() => setCopied(null), 1200);
    }
  }

  async function handleCopyReferenceJSON() {
    const context = getTargetContext(target.el, definitions?.referenceAttributes, definitions?.includeSemanticState ?? true);
    const ok = await copyText(formatTargetReferenceJSON(target.id, target.type, context, window.location.href));
    if (ok) {
      setCopied('json');
      setTimeout(() => setCopied(null), 1200);
    }
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter o Cmd+Enter para guardar (permite Enter normal para saltos de línea)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      cancelRef.current?.focus();
    }
  }

  // Trap de foco manual con 3 elementos focables: textarea -> Cancelar -> Save -> (loop) textarea.
  function handleCancelKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.focus();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveRef.current?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  function handleSaveKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      cancelRef.current?.focus();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      textareaRef.current?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  const disabled = text.trim().length === 0;

  return (
    <div className="ia-fra-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="ia-fra-modal"
        data-component-id="prompt-modal"
        data-component-kind="PromptModal"
        role="dialog"
        aria-modal="true"
        aria-label={`Prompt para ${target.id}`}
      >
        <div className="ia-fra-modal__template">
          <strong>Prompt para <code>{target.id}</code></strong>
          <span>Ruta actual · <code>{typeof window !== 'undefined' ? window.location.href : ''}</code></span>
        </div>
        {matchedComponent && <VariantSizePicker definition={matchedComponent} onPick={handlePick} />}
        {definitions?.theme && definitions.theme.length > 0 && (
          <ThemePicker tokens={definitions.theme} onPick={handlePick} />
        )}
        <textarea
          ref={textareaRef}
          className="ia-fra-modal__textarea"
          placeholder="Describí qué querés pedirle a la IA sobre este elemento…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
        />
        <label className="ia-fra-modal__capture-option">
          <input
            type="checkbox"
            checked={includeCapture}
            onChange={(e) => void handleCaptureToggle(e.target.checked)}
            disabled={capturing}
          />
          <span>{capturing ? 'Generando captura visual…' : 'Incluir captura visual del target'}</span>
        </label>
        {capturedImage && (
          <div className="ia-fra-modal__capture-preview">
            <img src={capturedImage} alt="Vista previa de la captura visual" />
            <button
              type="button"
              className="ia-fra-modal__btn"
              onClick={async () => {
                const ok = await copyImageDataUrl(capturedImage);
                setImageCopied(ok);
                if (ok) setTimeout(() => setImageCopied(false), 1200);
              }}
            >
              {imageCopied ? '¡Imagen copiada!' : 'Copiar captura al portapapeles'}
            </button>
          </div>
        )}
        {captureError && (
          <p className="ia-fra-modal__capture-error">
            No se pudo generar la imagen; el prompt se guardó sin captura.
          </p>
        )}
        <div className="ia-fra-modal__reference-actions">
          <button type="button" className="ia-fra-modal__btn" onClick={handleCopyReference}>
            {copied === 'text' ? '¡Referencia copiada!' : 'Copiar referencia'}
          </button>
          <button type="button" className="ia-fra-modal__btn" onClick={handleCopyReferenceJSON}>
            {copied === 'json' ? '¡JSON copiado!' : 'Copiar JSON'}
          </button>
        </div>
        <textarea
          className="ia-fra-modal__reference"
          placeholder="Pegá aquí una referencia adicional para anexarla al pedido…"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <div className="ia-fra-modal__actions">
          <button ref={cancelRef} type="button" className="ia-fra-modal__btn" onClick={onClose} onKeyDown={handleCancelKeyDown}>
            Cancelar
          </button>
          <button
            ref={saveRef}
            type="button"
            className="ia-fra-modal__btn ia-fra-modal__btn--primary"
            disabled={disabled}
            onClick={handleSubmit}
            onKeyDown={handleSaveKeyDown}
          >
            {capturing ? 'Capturando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
