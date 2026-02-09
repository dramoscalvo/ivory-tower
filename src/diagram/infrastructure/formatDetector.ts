export type DiagramFormat = 'mermaid' | 'plantuml' | 'json' | 'unknown';

export function detectFormat(input: string): DiagramFormat {
  const trimmed = input.trim();
  if (!trimmed) return 'unknown';

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.includes('classDiagram')) return 'mermaid';
  if (trimmed.includes('@startuml')) return 'plantuml';

  return 'unknown';
}
