/**
 * Version NAVIGATEUR de la connexion Bluetooth (le téléphone utilise bluetooth.ts).
 * Elle passe par "Web Bluetooth", disponible dans :
 *  - Chrome / Edge sur ordinateur et sur Android ;
 *  - l'appli gratuite « Bluefy » sur iPhone (Safari ne le permet pas).
 * Mêmes identifiants (FFE0 / FFE1) et même protocole que sur téléphone.
 */
import { AppareilTrouve, Planche } from './planche';

export const SERVICE_UUID = 0xffe0;
export const CARACTERISTIQUE_UUID = 0xffe1;

// Types minimaux : Web Bluetooth n'est pas encore dans les types standard de TypeScript.
/* eslint-disable @typescript-eslint/no-explicit-any */
type AppareilWeb = any;
const appareils = new Map<string, AppareilWeb>();

function bluetoothNavigateur(): any | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).bluetooth ?? null;
}

export function bluetoothDisponible(): boolean {
  return bluetoothNavigateur() !== null;
}

/**
 * Dans un navigateur, c'est le navigateur qui affiche la liste des appareils
 * et l'utilisateur en choisit un. Doit être appelé directement depuis un clic.
 */
export async function chercherPlanches(
  onTrouve: (a: AppareilTrouve) => void,
  onErreur: (message: string) => void,
): Promise<() => void> {
  const bt = bluetoothNavigateur();
  if (!bt) {
    onErreur(
      'Ce navigateur ne gère pas le Bluetooth. Utilisez Chrome (ordinateur, Android) ou l’appli Bluefy sur iPhone.',
    );
    return () => {};
  }
  try {
    const device = await bt.requestDevice({
      // On montre tous les appareils (le nom du HM-10 varie), mais on demande l'accès au service FFE0.
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    appareils.set(device.id, device);
    onTrouve({ id: device.id, nom: device.name ?? 'Planche' });
  } catch (e) {
    const message = (e as Error).message ?? '';
    if (!/cancel/i.test(message)) onErreur(`Recherche impossible : ${message}`);
    else onErreur('Aucune planche choisie.');
  }
  return () => {};
}

export async function connecterPlanche(appareil: AppareilTrouve): Promise<Planche> {
  const device = appareils.get(appareil.id);
  if (!device) throw new Error('Appareil introuvable, relancez la recherche');
  const serveur = await device.gatt.connect();
  const service = await serveur.getPrimaryService(SERVICE_UUID);
  const carac = await service.getCharacteristic(CARACTERISTIQUE_UUID);
  return new PlancheWeb(device, carac, appareil.nom);
}

class PlancheWeb implements Planche {
  private decodeur = new TextDecoder();
  private surValeur: ((e: any) => void) | null = null;
  private surDeconnexion: (() => void) | null = null;

  constructor(
    private device: AppareilWeb,
    private carac: any,
    public nom: string,
  ) {}

  async demarrer(onLigne: (ligne: string) => void, onDeconnexion: () => void) {
    this.surValeur = (e: any) => onLigne(this.decodeur.decode(e.target.value));
    this.surDeconnexion = () => {
      this.nettoyer();
      onDeconnexion();
    };
    this.carac.addEventListener('characteristicvaluechanged', this.surValeur);
    this.device.addEventListener('gattserverdisconnected', this.surDeconnexion);
    await this.carac.startNotifications();
  }

  async envoyer(commande: string) {
    const octets = new TextEncoder().encode(commande);
    if (this.carac.writeValueWithoutResponse) await this.carac.writeValueWithoutResponse(octets);
    else await this.carac.writeValue(octets);
  }

  async deconnecter() {
    this.nettoyer();
    try {
      await this.carac.stopNotifications();
    } catch {
      // déjà déconnecté
    }
    this.device.gatt?.disconnect();
  }

  private nettoyer() {
    if (this.surValeur) this.carac.removeEventListener('characteristicvaluechanged', this.surValeur);
    if (this.surDeconnexion) this.device.removeEventListener('gattserverdisconnected', this.surDeconnexion);
    this.surValeur = null;
    this.surDeconnexion = null;
  }
}
