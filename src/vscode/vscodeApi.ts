import type { WebviewApi } from './types';

declare global {
  interface Window {
    acquireVsCodeApi?: () => WebviewApi<unknown>;
  }
}

/**
 * VSCode webview API wrapper
 * Provides typed access to VSCode API when running in webview
 */
export const vscode: WebviewApi<unknown> | null =
  typeof window !== 'undefined' && window.acquireVsCodeApi ? window.acquireVsCodeApi() : null;

/**
 * Check if running inside VSCode webview
 */
export const isVsCode = vscode !== null;

/**
 * Post message to VSCode extension
 */
export function postMessage(message: unknown): void {
  if (vscode) {
    vscode.postMessage(message);
  }
}

/**
 * Types for VSCode messages
 */
export interface VsCodeFileContentMessage {
  type: 'fileContent';
  content: {
    architecture: string;
    useCases: string;
  };
}

export interface VsCodeReadyMessage {
  type: 'ready';
}

export interface VsCodeContentChangedMessage {
  type: 'contentChanged';
  content: {
    architecture: string;
    useCases: string;
  };
}

export type VsCodeMessage =
  | VsCodeFileContentMessage
  | VsCodeReadyMessage
  | VsCodeContentChangedMessage;
