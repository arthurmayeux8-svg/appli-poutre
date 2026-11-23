import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FournisseurConnexion } from '../state/connexion';
import { FournisseurDonnees } from '../state/donnees';
import { couleurs } from '../ui/composants';

/** Structure générale : les données, la connexion, puis les écrans. */
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
            headerBackTitle: 'Retour',
          }}
        >
          <Stack.Screen name="(onglets)" options={{ headerShown: false }} />
          <Stack.Screen name="parametres" options={{ title: 'Paramètres' }} />
          <Stack.Screen name="plan/[id]" options={{ title: 'Séance' }} />
        </Stack>
      </FournisseurConnexion>
    </FournisseurDonnees>
  );
}
