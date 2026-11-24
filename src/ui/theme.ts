/**
 * Charte graphique « Craie & Ardoise » de l'appli Poutre.
 * Toutes les couleurs, polices et tailles viennent d'ici : pour changer le style,
 * on change ce fichier (voir docs/15-charte-graphique.md).
 */

export const couleurs = {
  // Fonds
  fond: '#F5F2ED', // craie : fond de tous les écrans
  carte: '#FFFFFF',
  ardoise: '#1E2B33', // bleu-gris très foncé : bandeau du score, logo, textes
  ardoiseDouce: '#2E3F49',
  // Textes
  texte: '#1E2B33',
  texteDoux: '#66717A',
  texteSurArdoise: '#F5F2ED',
  texteSurArdoiseDoux: '#A9B5BC',
  // Couleur principale : orange magnésie (boutons, score, main droite)
  accent: '#E35D2A',
  accentFonce: '#C24A1C',
  accentDoux: '#FCE6DA',
  // Couleurs de sens
  vert: '#2F9461', // réussite, zone visée, planche connectée
  vertDoux: '#DCF1E4',
  rouge: '#C8412F', // erreur, baisse, suppression
  bleu: '#3B72B8', // main gauche
  bleuDoux: '#DEE9F6',
  vertSurArdoise: '#6FD39C', // hausse, sur fond ardoise
  rougeSurArdoise: '#F08A73', // baisse, sur fond ardoise
  bord: '#E7E2DA',
};

/** Police Outfit (Google Fonts, libre), chargée au démarrage dans src/app/_layout.tsx. */
export const polices = {
  normal: 'Outfit_400Regular',
  moyen: 'Outfit_500Medium',
  demiGras: 'Outfit_600SemiBold',
  gras: 'Outfit_700Bold',
  tresGras: 'Outfit_800ExtraBold',
};

export const rayons = { petit: 10, bouton: 14, carte: 20, pilule: 999 };

export const espaces = { xs: 4, s: 8, m: 12, l: 16, xl: 24 };

/** Ombre douce des cartes (iOS, Android et web). */
export const ombre = {
  shadowColor: '#1E2B33',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

/** Durées des animations, en millisecondes. */
export const durees = { rapide: 150, normale: 350, lente: 900 };
