export const generatePassword = (): string => {
  const length = 12; // Plus sécurisé qu'8

  const charsets = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    special: '!@#$%^&*()-_=+[]{}',
  };

  const allChars = Object.values(charsets).join('');

  // Garantit au moins 1 caractère de chaque catégorie
  const requiredChars = Object.values(charsets).map(
    (charset) => charset[Math.floor(Math.random() * charset.length)],
  );

  // Complète jusqu'à la longueur voulue
  const extraChars = Array.from(
    { length: length - requiredChars.length },
    () => allChars[Math.floor(Math.random() * allChars.length)],
  );

  // Mélange cryptographiquement plus fiable que sort(() => 0.5 - Math.random())
  const all = [...requiredChars, ...extraChars];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]; // Fisher-Yates shuffle
  }

  return all.join('');
};
