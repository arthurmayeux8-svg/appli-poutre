import { describe, expect, it } from 'vitest';
import { DecoupeurLignes, ecrireLigneMesure, lireLigneConfig, lireLigneMesure } from '../protocole';
import { base64VersTexte, texteVersBase64 } from '../../ble/base64';

describe('protocole', () => {
  it('lit une ligne de mesure en kg', () => {
    expect(lireLigneMesure('P,31250,29800')).toEqual([31.25, 29.8]);
  });
  it('refuse les lignes invalides', () => {
    expect(lireLigneMesure('X,12')).toBeNull();
    expect(lireLigneMesure('P,12,abc')).toBeNull();
    expect(lireLigneMesure('P')).toBeNull();
    expect(lireLigneMesure('P,12,')).toBeNull();
  });
  it('recolle les morceaux Bluetooth de 20 octets', () => {
    const d = new DecoupeurLignes();
    const message = ecrireLigneMesure([60000, 59000, 58000, 57000]) + ecrireLigneMesure([1, 2, 3, 4]);
    const lignes: string[] = [];
    for (let i = 0; i < message.length; i += 20) lignes.push(...d.ajouter(message.slice(i, i + 20)));
    expect(lignes).toEqual(['P,60000,59000,58000,57000', 'P,1,2,3,4']);
  });
  it('encode et décode le base64', () => {
    for (const t of ['T\n', 'P,123,456\n', 'ab', 'a']) expect(base64VersTexte(texteVersBase64(t))).toBe(t);
    expect(texteVersBase64('T\n')).toBe('VAo=');
  });
  it('lit la configuration envoyée par la planche', () => {
    expect(lireLigneConfig('C,G,G,D,D')).toEqual(['gauche', 'gauche', 'droite', 'droite']);
    expect(lireLigneConfig('c,l,r')).toEqual(['gauche', 'droite']);
    expect(lireLigneConfig('C,M')).toEqual(['centre']);
    expect(lireLigneConfig('C,X')).toBeNull();
    expect(lireLigneConfig('P,12')).toBeNull();
  });
});
