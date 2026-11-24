import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FournisseurConnexion } from '../state/connexion';
import { FournisseurDonnees } from '../state/donnees';
import { View } from 'react-native';
import { Logo } from '../ui/logo';
import { couleurs, polices } from '../ui/theme';

/** Structure générale : les données, la connexion, puis les écrans. */
export default function Layout() {
  const [policesChargees, erreurPolices] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  // Le temps de charger la police (une fraction de seconde), on montre le logo.
  if (!policesChargees && !erreurPolices) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond }}>
        <Logo taille={72} />
      </View>
    );
  }
  return (
    <FournisseurDonnees>
      <FournisseurConnexion>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: couleurs.fond },
            headerTintColor: couleurs.texte,
            headerTitleStyle: { fontFamily: polices.gras },
            animation: 'slide_from_right',
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
