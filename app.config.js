// Ajoute l'adresse de base du site quand on le publie sur GitHub Pages
// (https://<compte>.github.io/appli-poutre/). En local, rien ne change.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
