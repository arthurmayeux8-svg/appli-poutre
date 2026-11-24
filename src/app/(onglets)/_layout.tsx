import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ColorValue, Pressable } from 'react-native';
import { LogoEtNom } from '../../ui/logo';
import { couleurs, polices } from '../../ui/theme';

type NomIcone = keyof typeof Ionicons.glyphMap;

function icone(nom: NomIcone, nomActif: NomIcone) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? nomActif : nom} color={color as string} size={size} />
  );
}

/** Les trois onglets du bas, et la roue des paramètres en haut à droite. */
export default function LayoutOnglets() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.fond },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: polices.tresGras, fontSize: 20 },
        sceneStyle: { backgroundColor: couleurs.fond },
        tabBarActiveTintColor: couleurs.accent,
        tabBarInactiveTintColor: couleurs.texteDoux,
        tabBarStyle: { backgroundColor: couleurs.carte, borderTopColor: couleurs.bord, height: 70, paddingTop: 6, paddingBottom: 12 },
        tabBarLabelStyle: { fontFamily: polices.demiGras, fontSize: 12 },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paramètres"
            onPress={() => router.push('/parametres')}
            hitSlop={12}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="settings-outline" size={24} color={couleurs.ardoise} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', headerTitle: () => <LogoEtNom />, tabBarIcon: icone('home-outline', 'home') }} />
      <Tabs.Screen name="seance" options={{ title: 'Séance', tabBarIcon: icone('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="test" options={{ title: 'Test de force', tabBarIcon: icone('speedometer-outline', 'speedometer') }} />
    </Tabs>
  );
}
