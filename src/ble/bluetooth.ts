import { PermissionsAndroid, Platform } from 'react-native';
import type { BleManager as BleManagerType, Device, Subscription } from 'react-native-ble-plx';
import { base64VersTexte, texteVersBase64 } from './base64';
import { AppareilTrouve, Planche } from './planche';

/**
 * Identifiants Bluetooth utilisés par la planche.
 * FFE0 / FFE1 sont ceux du module HM-10 (le plus courant sur Arduino Uno).
 * Le programme Arduino fourni pour Nano 33 BLE / UNO R4 utilise les mêmes,
 * donc l'appli marche avec les deux sans rien changer.
 */
export const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const CARACTERISTIQUE_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

let manager: BleManagerType | null = null;

/**
 * Le Bluetooth n'existe pas dans "Expo Go" (l'appli de test d'Expo).
 * On le charge donc seulement si possible : sinon, seul le simulateur est proposé.
 */
function obtenirManager(): BleManagerType | null {
  if (manager) return manager;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BleManager } = require('react-native-ble-plx');
    manager = new BleManager() as BleManagerType;
    return manager;
  } catch {
    return null;
  }
}

export function bluetoothDisponible(): boolean {
  return obtenirManager() !== null;
}

/** Android demande l'autorisation de l'utilisateur avant de chercher des appareils. */
async function demanderPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const P = PermissionsAndroid.PERMISSIONS;
  const demandes =
    Number(Platform.Version) >= 31
      ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT, P.ACCESS_FINE_LOCATION]
      : [P.ACCESS_FINE_LOCATION];
  const res = await PermissionsAndroid.requestMultiple(demandes);
  return demandes.every((d) => res[d] === PermissionsAndroid.RESULTS.GRANTED);
}

/**
 * Cherche les appareils Bluetooth à proximité.
 * Renvoie une fonction à appeler pour arrêter la recherche.
 */
export async function chercherPlanches(
  onTrouve: (a: AppareilTrouve) => void,
  onErreur: (message: string) => void,
): Promise<() => void> {
  const m = obtenirManager();
  if (!m) {
    onErreur("Bluetooth indisponible dans cette version de l'appli (utilisez le simulateur).");
    return () => {};
  }
  if (!(await demanderPermissions())) {
    onErreur('Autorisation Bluetooth refusée.');
    return () => {};
  }
  const vus = new Set<string>();
  m.startDeviceScan(null, null, (err, appareil) => {
    if (err) {
      onErreur(err.message);
      return;
    }
    if (!appareil || vus.has(appareil.id)) return;
    const nom = appareil.name ?? appareil.localName;
    if (!nom) return; // on ignore les appareils sans nom
    vus.add(appareil.id);
    onTrouve({ id: appareil.id, nom });
  });
  return () => m.stopDeviceScan();
}

export async function connecterPlanche(appareil: AppareilTrouve): Promise<Planche> {
  const m = obtenirManager();
  if (!m) throw new Error('Bluetooth indisponible');
  m.stopDeviceScan();
  let device: Device = await m.connectToDevice(appareil.id);
  device = await device.discoverAllServicesAndCharacteristics();
  if (Platform.OS === 'android') {
    // Demande des paquets plus grands quand c'est possible (moins de découpage).
    device = await device.requestMTU(185).catch(() => device);
  }
  return new PlancheBluetooth(m, device, appareil.nom);
}

class PlancheBluetooth implements Planche {
  private abonnements: Subscription[] = [];

  constructor(
    private m: BleManagerType,
    private device: Device,
    public nom: string,
  ) {}

  async demarrer(onLigne: (ligne: string) => void, onDeconnexion: () => void) {
    this.abonnements.push(
      this.device.monitorCharacteristicForService(SERVICE_UUID, CARACTERISTIQUE_UUID, (err, carac) => {
        if (err || !carac?.value) return;
        onLigne(base64VersTexte(carac.value));
      }),
      this.m.onDeviceDisconnected(this.device.id, () => {
        this.nettoyer();
        onDeconnexion();
      }),
    );
  }

  async envoyer(commande: string) {
    await this.device.writeCharacteristicWithoutResponseForService(
      SERVICE_UUID,
      CARACTERISTIQUE_UUID,
      texteVersBase64(commande),
    );
  }

  async deconnecter() {
    this.nettoyer();
    await this.m.cancelDeviceConnection(this.device.id).catch(() => {});
  }

  private nettoyer() {
    this.abonnements.forEach((a) => a.remove());
    this.abonnements = [];
  }
}
