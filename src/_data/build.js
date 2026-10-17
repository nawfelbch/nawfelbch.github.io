// Version de construction : force le rechargement des CSS/JS après chaque mise en ligne.
const maintenant = new Date();
export default {
  version: maintenant.getTime().toString(36),
  date: maintenant.toISOString().slice(0, 10),
};
