# Installer une vraie appli (facultatif)

Le site suffit. Ces options sont utiles plus tard.

| Option | Bluetooth | Coût |
|---|---|---|
| Expo Go (QR code) | Non, simulateur seulement | Gratuit |
| Appli Android (.apk) | Oui | Gratuit, compte sur expo.dev |
| Appli iPhone | Oui | Compte développeur Apple : 99 € par an |

Fabriquer l'appli Android :

```bash
npx eas-cli@latest build --profile preview --platform android
```

Expo la fabrique en ligne (environ 15 min) et donne un lien pour installer le fichier .apk sur le téléphone.

**Expo Go sur iPhone** : il faut ouvrir l'appli Expo Go elle-même et être connecté au même compte Expo et au même Wi-Fi que l'ordinateur. Le QR code scanné avec l'appareil photo ne fonctionne pas toujours. Le site web est plus simple.
