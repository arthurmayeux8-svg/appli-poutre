# 15 · Charte graphique « Craie & Ardoise »

L'idée : les couleurs d'une salle de bloc. Un fond **craie** (la magnésie), un **ardoise** foncé pour les éléments importants, et un **orange** vif pour l'action.

Tout est réglé dans un seul fichier : `src/ui/theme.ts`. Pour changer une couleur partout, on la change là.

## Le logo

![Logo Poutre](../public/logo.svg)

- Un **P** (comme Poutre) : une barre couleur craie et une **boucle orange**.
- La boucle rappelle l'**anneau du score** de l'accueil, qui se remplit quand on progresse.
- Sur un carré **ardoise** aux coins arrondis. Reste lisible même en toute petite icône.
- Proposé le 24/11 parmi trois pistes (le sommet, les doigts, le P jauge), en attente du choix d'Arthur.

Fichiers :

| Fichier | Sert à |
|---|---|
| `public/logo.svg` | Le dessin d'origine (vectoriel), aussi l'icône de l'onglet du navigateur |
| `src/ui/logo.tsx` | Le même dessin dans l'appli (en-tête de l'accueil, écran d'ouverture) |
| `public/icone-192.png`, `public/icone-512.png` | Icônes de l'écran d'accueil (Android) |
| `public/apple-touch-icon.png` | Icône de l'écran d'accueil (iPhone) |
| `assets/icon.png`, `assets/favicon.png`, `assets/splash-icon.png` | Icônes de l'appli installée |

À éviter : changer les couleurs du logo, l'étirer, le poser sur un fond orange.

## Les couleurs

| Nom dans le code | Couleur | Utilisation |
|---|---|---|
| `fond` (craie) | `#F5F2ED` | Fond de tous les écrans |
| `carte` | `#FFFFFF` | Cartes |
| `ardoise` | `#1E2B33` | Carte du score, logo, textes, option choisie |
| `accent` (orange magnésie) | `#E35D2A` | Boutons, score, courbe, **main droite** |
| `bleu` | `#3B72B8` | **Main gauche** |
| `vert` | `#2F9461` | Réussite, zone visée, planche connectée |
| `rouge` | `#C8412F` | Erreur, baisse, suppression |
| `texteDoux` | `#66717A` | Textes secondaires, légendes |
| `bord` | `#E7E2DA` | Bords des cartes, lignes |

Règles :

- **Un seul bouton orange plein par écran** : l'action principale. Les autres sont en contour.
- Gauche = **bleu**, droite = **orange**, partout (graphiques, chiffres).
- Le vert ne sert qu'à dire « c'est bon ».

## La police

**Outfit** (Google Fonts, gratuite et libre). Ronde, lisible, sportive.

| Usage | Graisse | Taille |
|---|---|---|
| Grand titre (« Salut … ! ») | ExtraBold 800 | 26 |
| Chiffres mis en avant | ExtraBold 800 | 30 à 56 |
| Titre de carte | Bold 700 | 18 |
| Bouton | Bold 700 | 16 |
| Titre de section (MAJUSCULES espacées) | Bold 700 | 12 |
| Texte | Regular 400 | 15 |
| Légende | Regular 400 | 13 à 14 |

## Les formes

- Cartes : coins arrondis **20**, bord fin, ombre très légère.
- Boutons : coins arrondis **14**, icône à gauche du texte.
- Choix (prise, main…) : **pilules** ; l'option choisie est en ardoise.
- Marges : 16 sur les côtés, 12 entre les cartes. Sur grand écran, le contenu ne dépasse pas 640 de large.

## L'écran d'ouverture

À chaque lancement (`src/ui/ouverture.tsx`, environ 2,5 s) :

1. Sur fond ardoise, la barre du P monte, puis la boucle orange se dessine comme l'anneau du score.
2. Le nom **Poutre** apparaît, puis la phrase « Mesure ta force. Entraîne tes doigts. »
3. Tout s'efface en grossissant légèrement, et on arrive sur l'accueil.

Un appui n'importe où passe directement à l'appli.

## Les animations

Toutes dans `src/ui/animations.tsx`. Courtes (0,15 à 1,2 s) et douces, pour ne jamais gêner pendant l'effort.

| Animation | Où |
|---|---|
| Les cartes **apparaissent en glissant** l'une après l'autre | À l'ouverture de chaque écran |
| L'**anneau du score se remplit** et le nombre **compte** jusqu'au score | Accueil |
| La **courbe se dessine** de gauche à droite | Accueil (progression) |
| Les **barres gauche/droite poussent** | Test de force |
| Les boutons **s'enfoncent** légèrement quand on appuie | Partout |
| Le point vert **« respire »** quand la planche est connectée | Bandeau de connexion |
| Le résultat d'un test et la fin de séance arrivent avec un **petit rebond** | Test, Séance |
| Les icônes d'onglet se **remplissent** quand l'onglet est choisi | Barre du bas |
| Les écrans glissent depuis la droite | Paramètres, séance guidée |

Pendant un test ou une séance, la jauge de force n'est **pas** animée : elle suit la planche en direct, sans retard.
