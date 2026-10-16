# Portfolio de Walass

Portfolio de Lawadan Kodjo Wulfred (Walass), développeur Full-Stack chez E-business Afrique à Lomé.
Toute la page flotte sur une mer ensoleillée en 3D temps réel (Three.js), inspirée des paysages de One Piece : le défilement fait naviguer la caméra sur l'eau. Ambiance sonore optionnelle. La météo passe toute seule à l'état suivant toutes les 30 secondes (jour, nuit, nuit avec vent, nuit avec pluie, puis retour au jour) ; un double-clic sur le logo avance immédiatement, relance le compte à rebours et mémorise le choix sur l'appareil.

## Démarrer

```bash
npm install
npm run dev       # serveur de développement
npm run build     # build de production dans dist/
npm run preview   # sert dist/ en local
```

Déploiement : projet Vite statique, compatible Vercel sans configuration (`npm run build`, dossier `dist`).

## Organisation

| Chemin | Rôle |
| --- | --- |
| `src/data/content.js` | **Tout le contenu** : profil, projets, compétences, parcours, clubs. C'est le seul fichier à modifier pour mettre le portfolio à jour. |
| `src/scene/` | Mer 3D en fond de toute la page, avec palettes jour et nuit : vagues de Gerstner (`waves.js`), ciel avec nuages et montagnes (`sky.js`), océan avec reflets et scintillements (`ocean.js`), navire en style animé inspiré du Thousand Sunny, avec le W à la place du Jolly Roger (`sunny.js`), mouettes, particules de lumière, pluie (`rain.js`), panneau de contact accroché au navire en CSS3D (`shipboard.js`), assemblage, caméra et météo (`seascape.js`). En arrivant à la section Contact, la caméra vole jusqu'au navire pour afficher ce panneau (écrans larges en paysage). Sur téléphone, la caméra rejoint aussi le navire mais le contact reste une carte de la page, plus lisible. Chargé à part, après le contenu. |
| `src/weather.js` | Liste des états météo du cycle et leurs libellés. |
| `src/audio/ambience.js` | Ambiance sonore activée par le visiteur : ressac, vent et pluie synthétisés, cris de goélands. |
| `src/ui/worldmap.js` | Carte du monde des projets (SVG) : Red Line, Grand Line, Calm Belts, Reverse Mountain, quatre Blues ; chaque projet est une île cliquable. |
| `src/ui/projects.js` | Panneau de détail du projet sélectionné sur la carte. |
| `src/ui/sections.js` | Rendu des compétences, du parcours, des engagements et du contact. |
| `src/ui/navigation.js` | Lien actif du menu, menu mobile, apparitions au défilement. |
| `src/styles/main.css` | Styles, tokens de couleur en tête de fichier. |
| `public/` | Photos, captures de projets (WebP), CV en PDF, son de goéland, monogramme (`favicon.svg`, aussi utilisé comme logo). |

## Ajouter un projet

Ajouter une entrée dans `projects` (`src/data/content.js`) :

- `sea` : `grand-line` (entreprise), `north-blue` (applications web), `east-blue` (mobile, desktop et IA), `west-blue` (sites et interfaces) ou `south-blue` (vie associative) ;
- `x` / `y` : position de l'île sur la carte (repère 1040 × 770) ;
- `mapLabel` (optionnel) : nom court affiché sur la carte quand le titre est trop long ;
- `stack` : les outils utilisés. Ils alimentent automatiquement les compteurs des compétences, à condition d'avoir le même nom que dans `arsenal` ;
- `image` (optionnel) : capture en WebP dans `public/images/projects/`. Sans image, une couverture graphique est générée automatiquement.

## Accessibilité

- La scène 3D est décorative : sans WebGL, le haut de page garde un dégradé peint et tout le contenu reste accessible.
- `prefers-reduced-motion` : mer ralentie, pas de parallaxe, d'animation d'apparition ni de défilement animé.
- Le rendu 3D est suspendu quand l'onglet est masqué.
- Le son est désactivé par défaut et ne démarre qu'au clic.
- Le panneau de contact sur le navire est du vrai HTML (liens cliquables, texte lisible par les lecteurs d'écran). Sans WebGL ou avec `prefers-reduced-motion`, le contact reste une section classique.
- Les textes posés sur la mer sont blancs avec une ombre douce, un voile s'assombrit au défilement pour préserver le contraste.

## Crédits

- Cris de goéland : enregistrement XC707075 (European Herring Gull) de xeno-canto, publié en CC0 sur Wikimedia Commons.
