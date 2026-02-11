const SVG_STYLE_PROPERTIES = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'opacity',
] as const;

function inlineComputedStyles(original: SVGElement, clone: Element): void {
  const computed = getComputedStyle(original);
  const inlineStyles: string[] = [];

  for (const prop of SVG_STYLE_PROPERTIES) {
    const value = computed.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'normal' && value !== '') {
      inlineStyles.push(`${prop}: ${value}`);
    }
  }

  if (inlineStyles.length > 0) {
    clone.setAttribute('style', inlineStyles.join('; '));
  }

  clone.removeAttribute('class');

  const originalChildren = original.children;
  const cloneChildren = clone.children;

  for (let i = 0; i < originalChildren.length; i++) {
    if (originalChildren[i] instanceof SVGElement) {
      inlineComputedStyles(originalChildren[i] as SVGElement, cloneChildren[i]);
    }
  }
}

export function exportSvgFromElement(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Remove the CSS transform (pan/zoom) and set proper viewBox
  clone.removeAttribute('style');
  clone.removeAttribute('class');

  // Calculate bounds from the original SVG content
  const bbox = svgElement.getBBox();
  const padding = 20;
  const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', viewBox);
  clone.setAttribute('width', String(bbox.width + padding * 2));
  clone.setAttribute('height', String(bbox.height + padding * 2));

  // Resolve computed styles to inline styles
  inlineComputedStyles(svgElement, clone);

  // Resolve marker colors: read computed background and line colors from the document
  const rootStyles = getComputedStyle(document.documentElement);
  const bgColor = rootStyles.getPropertyValue('--bg-primary').trim() || '#0f0f23';
  const lineColor = rootStyles.getPropertyValue('--diagram-line').trim() || '#888';

  // Update marker defs with resolved colors
  const defs = clone.querySelector('defs');
  if (defs) {
    const markers = defs.querySelectorAll('marker');
    markers.forEach(marker => {
      const path = marker.querySelector('path');
      if (!path) return;

      const id = marker.getAttribute('id');
      if (id === 'arrow-hollow' || id === 'diamond-hollow') {
        path.setAttribute('fill', bgColor);
        path.setAttribute('stroke', lineColor);
      } else if (id === 'diamond-filled') {
        path.setAttribute('fill', lineColor);
        path.setAttribute('stroke', lineColor);
      } else if (id === 'arrow-open') {
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', lineColor);
      }
    });
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const header = `<?xml version="1.0" encoding="UTF-8"?>`;
  return `${header}\n${svgString}`;
}

export function getSvgFilename(title: string): string {
  return `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
}
