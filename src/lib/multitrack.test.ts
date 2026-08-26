import { describe, it, expect } from "vitest";
import { canUseContinuousRails, MAX_SINA_CONTINUA } from "./multitrack";

// Fiecare secțiune e o deschidere fizică SEPARATĂ. Șinele continue se
// evaluează per secțiune, NICIOADATĂ pe lățimea sumată. Adăugarea unei
// secțiuni nu poate invalida configurația validă a alteia.

describe("canUseContinuousRails — independența secțiunilor", () => {
  it("permite șină continuă pentru o singură secțiune de 4.0m (4000mm)", () => {
    expect(canUseContinuousRails([{ width: "4.0" }])).toBe(true);
  });

  it("permite șină continuă pentru 4.0 + 3.2 (REGRESIE: suma 7.2m o bloca)", () => {
    expect(canUseContinuousRails([{ width: "4.0" }, { width: "3.2" }])).toBe(true);
  });

  it("permite șină continuă pentru trei secțiuni independente 2.0 + 2.0 + 2.5", () => {
    expect(canUseContinuousRails([{ width: "2.0" }, { width: "2.0" }, { width: "2.5" }])).toBe(true);
  });

  it("NU permite șină continuă când o singură secțiune depășește șina brută (7.2m)", () => {
    expect(canUseContinuousRails([{ width: "7.2" }])).toBe(false);
  });

  it("NU permite șină continuă când ORICE secțiune depășește șina brută (4.0 + 7.0)", () => {
    expect(canUseContinuousRails([{ width: "4.0" }, { width: "7.0" }])).toBe(false);
  });

  it("permite șină continuă exact la limita șinei brute (6.3m)", () => {
    expect(canUseContinuousRails([{ width: String(MAX_SINA_CONTINUA) }])).toBe(true);
  });

  it("tratează o secțiune necompletată (width gol) ca neeligibilă", () => {
    expect(canUseContinuousRails([{ width: "" }])).toBe(false);
  });
});

describe("canUseContinuousRails — cazuri de validare Preview2D", () => {
  it("permite șină continuă pentru o singură secțiune de 2.0m", () => {
    expect(canUseContinuousRails([{ width: "2.0" }])).toBe(true);
  });

  it("permite șină continuă pentru două secțiuni 4.8 + 4.8 (total 9.6m)", () => {
    expect(canUseContinuousRails([{ width: "4.8" }, { width: "4.8" }])).toBe(true);
  });

  it("respinge șină continuă dacă o secțiune din două depășește 6.3m (5.0 + 7.0)", () => {
    expect(canUseContinuousRails([{ width: "5.0" }, { width: "7.0" }])).toBe(false);
  });

  it("permite secțiuni cu lățimi și număr de canate diferite (3.0/3 canate + 4.5/5 canate)", () => {
    const sections = [{ width: "3.0", nrCanate: 3 }, { width: "4.5", nrCanate: 5 }];
    expect(canUseContinuousRails(sections)).toBe(true);
    expect(sections[0].nrCanate).toBeGreaterThan(0);
    expect(sections[1].nrCanate).toBeGreaterThan(0);
  });
});
