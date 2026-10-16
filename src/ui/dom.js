/**
 * Minimal element factory. Text is always set through textContent, never innerHTML.
 * @param {string} tag
 * @param {Record<string, string | boolean | Function>} [attributes]
 * @param {Array<Node | string | null | false>} [children]
 */
export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children) {
    if (child === null || child === false) continue;
    node.append(child);
  }
  return node;
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
