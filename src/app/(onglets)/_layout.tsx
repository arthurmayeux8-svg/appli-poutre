import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ColorValue, Pressable } from 'react-native';
import { couleurs } from '../../ui/composants';

type NomIcone = keyof typeof Ionicons.glyphMap;

function icone(nom: NomIcone) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={nom} color={color as string} size={size} />;
}

/** Les trois onglets du bas, et la roue des paramètres en haut à droite. */
export default function LayoutOnglets() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.fond },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: couleurs.fond },
        tabBarActiveTintColor: couleurs.accent,
        tabBarInactiveTintColor: couleurs.texteDoux,
        tabBarStyle: { backgroundColor: couleurs.carte, borderTopColor: couleurs.bord },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paramètres"
            onPress={() => router.push('/parametres')}
            hitSlop={12}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="settings-outline" size={24} color={couleurs.texte} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('home-outline') }} />
      <Tabs.Screen name="seance" options={{ title: 'Séance', tabBarIcon: icone('barbell-outline') }} />
      <Tabs.Screen name="test" options={{ title: 'Test de force', tabBarIcon: icone('speedometer-outline') }} />
    </Tabs>
  );
}
