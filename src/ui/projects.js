import { el } from './dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function hashString(text) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Smooth irregular island outline around (cx, cy), stable for a given seed. */
function islandPath(cx, cy, radius, seed) {
  let s = seed || 1;
  const random = () => ((s = Math.imul(s, 48271) % 2147483647) & 0xffff) / 0xffff;
  const vertices = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const r = radius * (0.74 + random() * 0.42);
    return [cx + Math.cos(angle) * r * 1.1, cy + Math.sin(angle) * r * 0.95];
  });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const fmt = (point) => point.map((n) => n.toFixed(1)).join(' ');
  let d = `M ${fmt(mid(vertices.at(-1), vertices[0]))}`;
  vertices.forEach((current, i) => {
    d += ` Q ${fmt(current)} ${fmt(mid(current, vertices[(i + 1) % vertices.length]))}`;
  });
  return `${d} Z`;
}

/** Cover for projects without a screenshot: the project's island in stacked tints. */
function projectCover(project) {
  const seed = hashString(project.id);
  const art = svg('svg', { viewBox: '0 0 400 250', class: 'cover-art', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid slice' });
  for (let i = 0; i < 7; i++) {
    art.append(svg('path', { d: islandPath(290, 120, 120 * (1 - i * 0.13), seed), class: 'cover-contour' }));
  }
  return el('div', { class: 'cover', role: 'img', 'aria-label': `Visuel du projet ${project.title}` }, [
    art,
    el('div', { class: 'cover-text' }, [
      el('p', { class: 'cover-context', text: project.context }),
      el('p', { class: 'cover-title', text: project.title }),
      project.stack.length ? el('p', { class: 'cover-stack', text: project.stack.join(' · ') }) : null,
    ]),
  ]);
}

/**
 * Detail panel of the selected project.
 * `onSelect` and `onFilter` let the world map follow the selection and the tool filter.
 */
export function createProjectExplorer({ detailRoot, ledeRoot, projects, seas, onSelect = () => {}, onFilter = () => {} }) {
  const seaById = new Map(seas.map((sea) => [sea.id, sea]));
  let activeIndex = 0;
  let activeTool = null;

  function renderLede() {
    if (!activeTool) {
      ledeRoot.replaceChildren(
        `${projects.length} projets répartis sur la carte, classés par domaine. Cliquez sur une île pour découvrir le projet.`,
      );
      return;
    }
    const count = projects.filter((p) => p.stack.includes(activeTool)).length;
    ledeRoot.replaceChildren(
      el('span', { class: 'chart-filter' }, [
        'Projets utilisant ',
        el('strong', { text: activeTool }),
        ` : ${count}. `,
        el('button', { type: 'button', class: 'link-button', text: 'Afficher tous les projets', onclick: () => filterByTool(null) }),
      ]),
    );
  }

  function renderDetail(project, index) {
    const sea = seaById.get(project.sea);
    const visual = project.image
      ? el('figure', { class: `logbook-figure${project.imageFit === 'contain' ? ' logbook-figure-contain' : ''}` }, [
          el('img', { src: project.image, alt: `Capture d'écran de ${project.title}`, loading: 'lazy' }),
        ])
      : projectCover(project);

    const links = project.links.length
      ? el(
          'div',
          { class: 'logbook-links' },
          project.links.map((link) =>
            el('a', { class: 'button button-small', href: link.href, target: '_blank', rel: 'noopener noreferrer', text: link.label }),
          ),
        )
      : el('p', {
          class: 'logbook-private',
          text: project.confidential ? 'Projet interne : code et captures confidentiels.' : 'Code source non publié.',
        });

    const previous = (index - 1 + projects.length) % projects.length;
    const next = (index + 1) % projects.length;

    detailRoot.replaceChildren(
      ...[
        el('p', { class: 'logbook-index', text: `${String(index + 1).padStart(2, '0')} / ${projects.length} · ${sea.theme}` }),
        visual,
        el('h3', { class: 'logbook-title', text: project.title }),
        el('p', { class: 'logbook-meta', text: `${project.context} · ${project.year}` }),
        el('p', { class: 'logbook-summary', text: project.summary }),
        project.stack.length ? el('ul', { class: 'tags', 'aria-label': 'Technologies' }, project.stack.map((tool) => el('li', { text: tool }))) : null,
        links,
        el('div', { class: 'logbook-nav' }, [
          el('button', { type: 'button', class: 'link-button', onclick: () => select(previous), 'aria-label': `Projet précédent : ${projects[previous].title}`, text: 'Précédent' }),
          el('button', { type: 'button', class: 'link-button', onclick: () => select(next), 'aria-label': `Projet suivant : ${projects[next].title}`, text: 'Suivant' }),
        ]),
      ].filter(Boolean),
    );
  }

  function select(index) {
    const changed = index !== activeIndex;
    activeIndex = index;
    renderDetail(projects[index], index);
    onSelect(index);
    if (changed) {
      // Restart the entrance animation of the detail panel for the new project.
      detailRoot.classList.remove('is-entering');
      void detailRoot.offsetWidth;
      detailRoot.classList.add('is-entering');
    }
  }

  function filterByTool(tool) {
    activeTool = tool;
    const isDimmed = (project) => Boolean(tool) && !project.stack.includes(tool);
    onFilter(isDimmed);
    renderLede();
    if (tool && !projects[activeIndex].stack.includes(tool)) {
      select(projects.findIndex((project) => project.stack.includes(tool)));
    }
  }

  renderLede();
  select(0);

  return { select, filterByTool };
}
