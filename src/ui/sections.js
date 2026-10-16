import { el } from './dom.js';

export function renderDossier(root, profile) {
  const rows = [
    ['Poste', `${profile.role}, ${profile.employer} (depuis ${profile.roleSince})`],
    ['Diplôme', `${profile.degree} (${profile.graduation})`],
    ['École', profile.school],
    ['Localisation', profile.location],
    ['Langues', profile.languages],
  ];
  root.replaceChildren(...rows.flatMap(([term, value]) => [el('dt', { text: term }), el('dd', { text: value })]));
}

export function renderArsenal(root, { arsenal, projects, onToolSelect }) {
  const usage = new Map();
  for (const project of projects) {
    for (const tool of project.stack) usage.set(tool, (usage.get(tool) ?? 0) + 1);
  }

  root.replaceChildren(
    ...arsenal.map((hold) =>
      el('article', { class: 'hold' }, [
        el('h3', { class: 'hold-title', text: hold.name }),
        el(
          'ul',
          { class: 'hold-tools' },
          hold.tools.map((tool) => {
            const count = usage.get(tool);
            if (!count) return el('li', {}, [el('span', { class: 'tool', text: tool })]);
            return el('li', {}, [
              el(
                'button',
                {
                  type: 'button',
                  class: 'tool tool-used',
                  'aria-label': `${tool} : voir les ${count} projet${count > 1 ? 's' : ''} sur la carte`,
                  onclick: () => onToolSelect(tool),
                },
                [tool, el('span', { class: 'tool-count', 'aria-hidden': 'true', text: String(count) })],
              ),
            ]);
          }),
        ),
      ]),
    ),
  );
}

export function renderJournal(root, journey) {
  const kindLabel = { work: 'Expérience', school: 'Formation' };
  root.replaceChildren(
    ...journey.map((entry) =>
      el('li', { class: `journal-entry journal-entry-${entry.kind}` }, [
        el('p', { class: 'journal-period', text: entry.period }),
        el('div', { class: 'journal-body' }, [
          el('p', { class: 'journal-kind', text: kindLabel[entry.kind] }),
          el('h3', { class: 'journal-title', text: entry.title }),
          el('p', { class: 'journal-place', text: entry.place }),
          el('p', { class: 'journal-text', text: entry.text }),
        ]),
      ]),
    ),
  );
}

export function renderOffstage(root, offstage) {
  root.replaceChildren(
    ...offstage.map((crew) =>
      el('li', { class: 'crew' }, [
        el('p', { class: 'crew-role', text: crew.period ? `${crew.role} · ${crew.period}` : crew.role }),
        el('h3', { class: 'crew-org', text: crew.org }),
        crew.events.length ? el('ul', { class: 'tags', 'aria-label': 'Concours' }, crew.events.map((event) => el('li', { text: event }))) : null,
      ]),
    ),
  );
}

export function renderContact({ emailLink, copyButton, feedback, linksRoot, yearRoot }, profile) {
  emailLink.href = `mailto:${profile.email}`;
  emailLink.textContent = profile.email;

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      feedback.textContent = 'Adresse copiée.';
    } catch (error) {
      console.warn('Clipboard unavailable', error);
      feedback.textContent = "Copie impossible : sélectionnez l'adresse.";
    }
    window.setTimeout(() => (feedback.textContent = ''), 2500);
  });

  const links = [
    { label: 'Téléphone', handle: profile.phone, href: profile.phoneHref },
    ...profile.socials,
    { label: 'CV', handle: 'PDF', href: profile.cv, download: true },
  ];
  linksRoot.replaceChildren(
    ...links.map((link) => {
      const external = link.href.startsWith('http');
      return el('li', {}, [
        el(
          'a',
          {
            href: link.href,
            target: external ? '_blank' : null,
            rel: external ? 'noopener noreferrer' : null,
            download: link.download ?? false,
          },
          [el('span', { class: 'contact-link-label', text: link.label }), el('span', { class: 'contact-link-handle', text: link.handle })],
        ),
      ]);
    }),
  );

  yearRoot.textContent = String(new Date().getFullYear());
}
