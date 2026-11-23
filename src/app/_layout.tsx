import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FournisseurConnexion } from '../state/connexion';
import { FournisseurDonnees } from '../state/donnees';
import { couleurs } from '../ui/composants';

/** Structure générale de l'appli : les données, la connexion, puis les écrans. */
export default function Layout() {
  return (
    <FournisseurDonnees>
      <FournisseurConnexion>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: couleurs.fond },
            headerTintColor: couleurs.texte,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: couleurs.fond },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Poutre' }} />
          <Stack.Screen name="connexion" options={{ title: 'Connexion' }} />
          <Stack.Screen name="test" options={{ title: 'Test de force' }} />
          <Stack.Screen name="entrainement" options={{ title: 'Entraînement' }} />
          <Stack.Screen name="seance/[id]" options={{ title: 'Séance' }} />
          <Stack.Screen name="profil" options={{ title: 'Profil et progression' }} />
          <Stack.Screen name="reglages" options={{ title: 'Réglages' }} />
        </Stack>
      </FournisseurConnexion>
    </FournisseurDonnees>
  );
}
