// Multitrack — reguli de secțiune independente.
// Fiecare secțiune este o deschidere fizică SEPARATĂ în aceeași locație/proiect.
// Continuitatea șinelor se evaluează per secțiune, NICIOADATĂ pe lățimea sumată.

export const MAX_SINA_CONTINUA = 6.3; // m — lungimea brută a unei șine

/**
 * Șinele neîntrerupte (continue, full-length) sunt permise doar dacă FIECARE
 * secțiune, individual, se încadrează în lungimea brută a șinei.
 *
 * Secțiunile sunt deschideri fizice separate — continuitatea NU se propagă
 * peste granițele dintre secțiuni, deci suma lățimilor e irelevantă.
 * Adăugarea unei secțiuni nu poate invalida configurația validă a alteia.
 *
 * @param sections secțiunile configurate (width în metri, string ca în UI)
 * @param maxRawM lungimea brută maximă a unei șine continue (default 6.3m)
 * @returns true dacă toate secțiunile permit șină continuă
 */
export function canUseContinuousRails(
  sections: { width: string }[],
  maxRawM: number = MAX_SINA_CONTINUA
): boolean {
  return sections.length > 0 && sections.every(s => {
    const sw = parseFloat(s.width);
    return Number.isFinite(sw) && sw > 0 && sw <= maxRawM;
  });
}
