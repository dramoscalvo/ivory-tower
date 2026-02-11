/**
 * Build a map from JSON path strings (e.g., "entities[0].name") to line numbers (1-based).
 * Walks through the JSON string character by character to track nesting.
 */
export function buildPathLineMap(json: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = json.split('\n');

  // Track nesting stack: each entry is { key, arrayIndex, type }
  const stack: Array<{ key: string; arrayIndex: number; type: 'object' | 'array' }> = [];
  let currentLine = 1;
  let inString = false;
  let escapeNext = false;
  let currentKey = '';
  let collectingKey = false;

  function currentPath(): string {
    const parts: string[] = [];
    for (const frame of stack) {
      if (frame.type === 'array') {
        if (frame.key) parts.push(frame.key);
        parts.push(`[${frame.arrayIndex}]`);
      } else if (frame.key) {
        parts.push(frame.key);
      }
    }
    return parts.join('.').replace(/\.\[/g, '[');
  }

  // Simple state-machine parser
  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (char === '\n') {
      currentLine++;
      continue;
    }

    if (escapeNext) {
      if (collectingKey) currentKey += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      if (collectingKey) currentKey += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      if (!inString) {
        inString = true;
        // Check if this is a key (next non-whitespace after this string should be ':')
        // We'll collect the key and check later
        currentKey = '';
        collectingKey = true;
      } else {
        inString = false;
        if (collectingKey) {
          collectingKey = false;
          // Check if followed by ':'
          let j = i + 1;
          while (
            j < json.length &&
            (json[j] === ' ' || json[j] === '\t' || json[j] === '\n' || json[j] === '\r')
          )
            j++;
          if (json[j] === ':') {
            // This is a key
            const top = stack[stack.length - 1];
            if (top && top.type === 'object') {
              // Record path → line for this key
              const path = currentPath() + (currentPath() ? '.' : '') + currentKey;
              // Find line for position i
              const lineNum = json.substring(0, i + 1).split('\n').length;
              map.set(path, lineNum);
            }
          }
        }
      }
      continue;
    }

    if (inString) {
      if (collectingKey) currentKey += char;
      continue;
    }

    if (char === '{') {
      const top = stack[stack.length - 1];
      if (top && top.type === 'array') {
        // We're entering an array element object
        const lineNum = json.substring(0, i + 1).split('\n').length;
        const path = currentPath();
        map.set(path, lineNum);
        stack.push({ key: '', arrayIndex: -1, type: 'object' });
      } else if (stack.length === 0) {
        stack.push({ key: '', arrayIndex: -1, type: 'object' });
      } else {
        stack.push({ key: '', arrayIndex: -1, type: 'object' });
      }
    } else if (char === '}') {
      stack.pop();
    } else if (char === '[') {
      stack.push({ key: '', arrayIndex: 0, type: 'array' });
    } else if (char === ']') {
      stack.pop();
    } else if (char === ',') {
      const top = stack[stack.length - 1];
      if (top && top.type === 'array') {
        top.arrayIndex++;
      }
    } else if (char === ':') {
      // The key before this colon should be applied to the current stack
      const top = stack[stack.length - 1];
      if (top && top.type === 'object') {
        // Store key for nesting - will be used when [ or { follows
        // Check what follows after the colon
        let j = i + 1;
        while (
          j < json.length &&
          (json[j] === ' ' || json[j] === '\t' || json[j] === '\n' || json[j] === '\r')
        )
          j++;
        if (json[j] === '[' || json[j] === '{') {
          // Update the next stack entry's parent key
          // We'll handle this by modifying the stack when [ or { is encountered
          // Store the key temporarily
          top.key = currentKey;
        }
      }
    }
  }

  // Also record line 1 for root/empty path
  map.set('', 1);

  void currentLine;
  void lines;

  return map;
}
