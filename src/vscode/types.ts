/**
 * VSCode webview API types
 */
export interface WebviewApi<T> {
  /**
   * Post a message to the extension host
   */
  postMessage(message: T): void;

  /**
   * Get persisted state from VSCode
   */
  getState(): T | undefined;

  /**
   * Set persisted state in VSCode
   */
  setState(state: T): void;
}
