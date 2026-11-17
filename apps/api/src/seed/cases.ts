import { defaultFindings } from '@manv/triage'
import type { SeedCase } from './seed.ts'

/**
 * Seed cases for VOR-Sichtung training. `legacy-<id>` are the 18 cases of the
 * old app (src/data/scenarios.js), `new-*` extend coverage (every step decisive
 * at least twice, AF boundary values, children, trap cases).
 * Training content: a qualified operator reviews every case before publishing.
 */
export const SEED_CASES: SeedCase[] = [
  // ── PAK weiß – gehfähig ───────────────────────────────────────────
  {
    slug: 'legacy-1',
    description:
      '34-jähriger Mann, steht aufrecht am Straßenrand und hält sich den linken Arm. Er ist ansprechbar, orientiert und kann selbstständig gehen.',
    reasoning:
      'Patient ist gehfähig → PAK weiß, Weiterleitung zur Sammelstelle. Die VOR-Sichtung endet beim ersten zutreffenden Punkt.',
    findings: { ...defaultFindings(), ambulatory: true },
    expectedCategory: 'white',
    focusFields: [],
    tags: ['Verkehrsunfall'],
  },
  {
    slug: 'legacy-9',
    description:
      '22-jährige Frau, geht selbstständig umher, weint, hat eine blutende Schnittwunde an der Stirn. Ansprechbar und orientiert.',
    reasoning:
      'Patientin ist gehfähig → PAK weiß. Die Stirnwunde blutet zwar, ist aber nicht lebensbedrohlich und keine Extremitätenblutung. Gehfähige Patienten gehen zur Sammelstelle – auch wenn sie verletzt sind.',
    findings: { ...defaultFindings(), ambulatory: true },
    expectedCategory: 'white',
    focusFields: ['ambulatory'],
    tags: ['Falle'],
  },
  {
    slug: 'legacy-10',
    description:
      '50-jähriger Mann, steht leicht schwankend, klagt über Schwindel und Übelkeit. Kann selbstständig gehen. Keine sichtbaren Verletzungen.',
    reasoning:
      'Patient ist gehfähig → PAK weiß. Trotz Schwindel und Übelkeit: Wer selbstständig gehen kann, wird zur Sammelstelle weitergeleitet. Dort erfolgt ggf. weitere Betreuung.',
    findings: { ...defaultFindings(), ambulatory: true },
    expectedCategory: 'white',
    focusFields: [],
    tags: [],
  },
  {
    slug: 'new-gehfaehig-splitterwunde',
    description:
      '41-jähriger Mann nach einer Explosion, humpelt selbstständig zur Absperrung. Am linken Unterschenkel eine Splitterwunde, die mäßig sickernd blutet; der Druckverband eines Ersthelfers hält.',
    reasoning:
      'Keine lebensbedrohliche Extremitätenblutung (sickernd, durch Druckverband kontrolliert) → X trifft nicht zu. Patient ist gehfähig → PAK weiß. Eine sichtbare Wunde allein macht keinen SK-1-Patienten.',
    findings: { ...defaultFindings(), ambulatory: true },
    expectedCategory: 'white',
    focusFields: ['x', 'ambulatory'],
    tags: ['Explosion', 'Falle'],
  },

  // ── Tot – sichere Todeszeichen ────────────────────────────────────
  {
    slug: 'legacy-4',
    description:
      'Ältere Frau, liegt regungslos. Totenstarre erkennbar, livide Totenflecken am Rücken sichtbar.',
    reasoning:
      'Sichere Todeszeichen (Totenstarre und Totenflecken) → Tot. Counterzählung, zeitnah abdecken, PAK auf Tot stellen. Ärztliche Leichenschau erforderlich.',
    findings: {
      ...defaultFindings(),
      definiteDeathSigns: true,
      radialPulsePalpable: false,
      respondsPurposefully: false,
    },
    expectedCategory: 'dead',
    focusFields: [],
    tags: [],
  },
  {
    slug: 'legacy-11',
    description:
      'Mann, eingeklemmt unter einer Betonplatte. Kopf massiv deformiert, mit dem Leben nicht vereinbare Verletzungen erkennbar.',
    reasoning:
      'Mit dem Leben nicht vereinbare Verletzungen sind sichere Todeszeichen → Tot. Keine Reanimation im MANV-Kontext. Counterzählung, abdecken, Leichenschau erforderlich.',
    findings: {
      ...defaultFindings(),
      definiteDeathSigns: true,
      radialPulsePalpable: false,
      respondsPurposefully: false,
    },
    expectedCategory: 'dead',
    focusFields: [],
    tags: [],
  },

  // ── SK 1 – X: lebensbedrohliche Extremitätenblutung ──────────────
  {
    slug: 'legacy-3',
    description:
      '52-jähriger Mann, liegt am Boden und schreit vor Schmerzen. Aus einer Wunde am rechten Oberschenkel spritzt hellrotes Blut, die Hose ist blutdurchtränkt.',
    reasoning:
      'Lebensbedrohliche Extremitätenblutung → sofort Tourniquet anlegen, Zeit notieren → SK 1. Entscheidend ist bereits der erste Schritt (X), nicht erst die Blutung unter C.',
    findings: {
      ...defaultFindings(),
      lifeThreateningExtremityBleeding: true,
      lifeThreateningBleeding: true,
    },
    expectedCategory: 'red',
    focusFields: ['x'],
    tags: [],
  },
  {
    slug: 'new-gehfaehig-spritzende-blutung',
    description:
      '29-jähriger Mann nach einer Explosion in einer Lagerhalle, läuft selbstständig auf die Einsatzkräfte zu. Aus einer Schnittwunde am rechten Unterarm spritzt in kräftigem Strahl hellrotes Blut, der Ärmel ist durchtränkt.',
    reasoning:
      'Lebensbedrohliche Extremitätenblutung → sofort Tourniquet, SK 1 (X). X steht vor der Gehfähigkeit: Auch wer gehen kann, wird bei lebensbedrohlicher Extremitätenblutung nicht zur Sammelstelle geschickt.',
    findings: {
      ...defaultFindings(),
      lifeThreateningExtremityBleeding: true,
      ambulatory: true,
      lifeThreateningBleeding: true,
    },
    expectedCategory: 'red',
    focusFields: ['x', 'ambulatory'],
    tags: ['Explosion', 'Falle'],
  },
  {
    slug: 'new-oberarm-blutlache',
    description:
      'Junge Frau nach einem Verkehrsunfall, liegt neben dem Fahrzeug am Boden und ruft um Hilfe. Aus einer tiefen Rissquetschwunde am linken Oberarm tritt schwallartig Blut aus, darunter hat sich eine große Blutlache gebildet.',
    reasoning:
      'Lebensbedrohliche Extremitätenblutung → sofort Tourniquet, Zeit notieren → SK 1 (X). Die Sichtung endet beim ersten Schritt.',
    findings: {
      ...defaultFindings(),
      lifeThreateningExtremityBleeding: true,
      lifeThreateningBleeding: true,
    },
    expectedCategory: 'red',
    focusFields: ['x'],
    tags: ['Verkehrsunfall'],
  },

  // ── SK 1 – A: Stridor / Atemweg ──────────────────────────────────
  {
    slug: 'legacy-7',
    description:
      '30-jährige Frau, aus einem Brandraum gerettet, liegt am Boden und kann nicht gehen. Rußspuren im Gesicht, pfeifendes Atemgeräusch beim Einatmen hörbar.',
    reasoning:
      'Inhalationstrauma mit Stridor → SK 1 (A). Stridor weist auf eine Schwellung der oberen Atemwege hin – akute Erstickungsgefahr!',
    findings: { ...defaultFindings(), inhalationTraumaStridor: true },
    expectedCategory: 'red',
    focusFields: [],
    tags: ['Brand'],
  },
  {
    slug: 'new-stridor-normale-af',
    description:
      '45-jähriger Mann, aus einem verrauchten Treppenhaus gebracht, sitzt erschöpft am Boden und kann nicht aufstehen. Heisere Stimme, versengte Nasenhaare, bei jeder Einatmung ein pfeifendes Geräusch. AF gezählt: 22/min, Radialispuls tastbar.',
    reasoning:
      'Inhalationstrauma mit Stridor nach Rauchgasexposition → SK 1 (A). Die unauffällige AF ändert nichts: A kommt vor B, und die Schwellung der oberen Atemwege kann rasch zunehmen.',
    findings: { ...defaultFindings(), inhalationTraumaStridor: true, respiratoryRate: 22 },
    expectedCategory: 'red',
    focusFields: ['a', 'b'],
    tags: ['Brand', 'Falle'],
  },
  {
    slug: 'legacy-12',
    description:
      '40-jähriger Mann, liegt nach einem Sturz bewusstlos am Boden. Schnarcht laut, der Unterkiefer fällt zurück.',
    reasoning:
      'Offenhalten des Atemwegs erforderlich → SK 1 (A). Das Schnarchen zeigt eine Verlegung der oberen Atemwege an. Esmarch-Handgriff oder Seitenlage nötig.',
    findings: { ...defaultFindings(), airwayNeedsManagement: true, respondsPurposefully: false },
    expectedCategory: 'red',
    focusFields: [],
    tags: ['Sturz'],
  },
  {
    slug: 'new-gurgelnder-fahrer',
    description:
      'Fahrer eines verunfallten Kleinbusses, liegt bewusstlos neben dem Fahrzeug. Blut und Erbrochenes im Mund, deutliche Gurgelgeräusche bei der Atmung.',
    reasoning:
      'Gurgelgeräusche bei Bewusstlosigkeit zeigen einen verlegten Atemweg → Offenhalten des Atemwegs erforderlich → SK 1 (A). Atemweg freimachen und sichern, z. B. Seitenlage.',
    findings: { ...defaultFindings(), airwayNeedsManagement: true, respondsPurposefully: false },
    expectedCategory: 'red',
    focusFields: ['a'],
    tags: ['Verkehrsunfall'],
  },

  // ── SK 1 – B: pathologische Atemfrequenz ─────────────────────────
  {
    slug: 'legacy-5',
    description:
      '8-jähriges Kind, sitzt nach dem Unfall am Boden und kann nicht aufstehen. Wach und ansprechbar, Schürfwunden an Armen und Beinen, keine starke Blutung. AF gezählt: 48/min.',
    reasoning:
      'Pathologische Atemfrequenz bei Kindern: AF > 40/min → SK 1 (B). Grenzwerte: Kinder < 15 oder > 40, Erwachsene < 10 oder > 30!',
    findings: { ...defaultFindings(), ageGroup: 'child', respiratoryRate: 48 },
    expectedCategory: 'red',
    focusFields: [],
    tags: ['Kind'],
  },
  {
    slug: 'legacy-8',
    description:
      '60-jähriger Mann, liegt unterkühlt in einer Pfütze und reagiert kaum. Keine sichtbare Blutung, Atemwege frei. AF gezählt: 7/min.',
    reasoning:
      'Pathologische Atemfrequenz: AF 7/min (< 10 bei Erwachsenen) → SK 1 (B). Dass er kaum reagiert (D), spielt keine Rolle mehr – B entscheidet zuerst.',
    findings: { ...defaultFindings(), respiratoryRate: 7, respondsPurposefully: false },
    expectedCategory: 'red',
    focusFields: [],
    tags: [],
  },
  {
    slug: 'legacy-13',
    description:
      '28-jährige Frau nach einem Motorradunfall, liegt auf dem Rücken und kann nicht aufstehen. Wach, klagt über Atemnot, keine äußere Blutung. AF gezählt: 34/min.',
    reasoning:
      'Pathologische Atemfrequenz: AF 34/min (> 30 bei Erwachsenen) → SK 1 (B). Auch knapp über dem Grenzwert ist pathologisch!',
    findings: { ...defaultFindings(), respiratoryRate: 34 },
    expectedCategory: 'red',
    focusFields: [],
    tags: ['Verkehrsunfall'],
  },
  {
    slug: 'new-af-9',
    description:
      '62-jähriger Mann, liegt nach einer Massenpanik am Boden und kann nicht aufstehen. Reagiert verlangsamt, beantwortet Fragen aber passend. Keine Blutung sichtbar, Atemwege frei, AF gezählt: 9/min.',
    reasoning:
      'AF 9/min liegt unter 10 → pathologische Atemfrequenz → SK 1 (B). Bei Erwachsenen gilt die AF erst ab 10/min als unauffällig.',
    findings: { ...defaultFindings(), respiratoryRate: 9 },
    expectedCategory: 'red',
    focusFields: ['b'],
    tags: ['Massenpanik', 'Grenzwert'],
  },
  {
    slug: 'new-af-31',
    description:
      '24-jährige Frau, wurde im Gedränge gegen eine Absperrung gedrückt, sitzt am Boden und kann nicht aufstehen. Wach, klagt über Schmerzen im Brustkorb, keine äußere Blutung. AF gezählt: 31/min.',
    reasoning:
      'AF 31/min liegt über 30 → pathologische Atemfrequenz → SK 1 (B). Schon ein Atemzug pro Minute über dem Grenzwert reicht.',
    findings: { ...defaultFindings(), respiratoryRate: 31 },
    expectedCategory: 'red',
    focusFields: ['b'],
    tags: ['Massenpanik', 'Grenzwert'],
  },
  {
    slug: 'new-kind-af-14',
    description:
      '5-jähriges Mädchen, liegt nach einem Gedränge am Boden und kann nicht aufstehen. Wirkt schläfrig, antwortet aber auf Fragen. Keine Blutung sichtbar, Atemwege frei, AF gezählt: 14/min.',
    reasoning:
      'Bei Kindern ist eine AF < 15/min pathologisch → SK 1 (B). Mit den Erwachsenen-Grenzwerten (< 10) wäre AF 14 unauffällig – Kinder-Grenzwerte beachten!',
    findings: { ...defaultFindings(), ageGroup: 'child', respiratoryRate: 14 },
    expectedCategory: 'red',
    focusFields: ['b'],
    tags: ['Kind', 'Massenpanik', 'Grenzwert'],
  },
  {
    slug: 'new-kind-af-41',
    description:
      '10-jähriges Mädchen, Mitfahrerin in einem verunfallten Reisebus, sitzt am Boden und kann nicht aufstehen. Wach, ängstlich, klagt über Bauchschmerzen, keine Blutung sichtbar. AF gezählt: 41/min.',
    reasoning:
      'Bei Kindern ist eine AF > 40/min pathologisch → SK 1 (B). Für Erwachsene läge der Grenzwert bei 30 – bei Kindern gelten eigene Grenzwerte.',
    findings: { ...defaultFindings(), ageGroup: 'child', respiratoryRate: 41 },
    expectedCategory: 'red',
    focusFields: ['b'],
    tags: ['Kind', 'Verkehrsunfall', 'Grenzwert'],
  },

  // ── SK 1 – C: lebensbedrohliche Blutung / kein Radialispuls ──────
  {
    slug: 'legacy-14',
    description:
      '36-jähriger Mann mit einer Stichverletzung am Bauch, liegt am Boden. Ansprechbar, aber blass, AF gezählt: 24/min. Pulsierendes Blut tritt aus der Wunde aus.',
    reasoning:
      'Lebensbedrohliche Blutung (pulsierend = arteriell) → SK 1 (C). X trifft nicht zu, weil keine Extremität betroffen ist: Kein Tourniquet möglich bei Rumpfverletzung – Kompression/Packing nötig.',
    findings: { ...defaultFindings(), respiratoryRate: 24, lifeThreateningBleeding: true },
    expectedCategory: 'red',
    focusFields: ['x', 'c'],
    tags: ['Falle'],
  },
  {
    slug: 'new-flankenblutung',
    description:
      '50-jährige Frau nach einer Explosion, liegt am Boden. Aus einer tiefen Splitterwunde an der rechten Flanke quillt trotz Druck mit der Hand stark Blut, die Kleidung ist durchtränkt. Ansprechbar, AF gezählt: 26/min.',
    reasoning:
      'Lebensbedrohliche Blutung am Rumpf → SK 1 (C). Der erste Schritt (X) gilt nur für Extremitätenblutungen – hier ist kein Tourniquet möglich, Kompression/Packing nötig.',
    findings: { ...defaultFindings(), respiratoryRate: 26, lifeThreateningBleeding: true },
    expectedCategory: 'red',
    focusFields: ['x', 'c'],
    tags: ['Explosion', 'Falle'],
  },
  {
    slug: 'legacy-2',
    description:
      '45-jährige Frau, liegt bewusstlos am Boden. Atmet regelmäßig und frei, AF gezählt: 14/min. Keine äußere Blutung sichtbar, kein Radialispuls tastbar (10 s geprüft).',
    reasoning:
      'Kein Radialispuls tastbar → SK 1 (C). Die Bewusstlosigkeit (D) wird nicht mehr geprüft: Die Sichtung endet beim ersten zutreffenden SK-1-Kriterium.',
    findings: {
      ...defaultFindings(),
      respiratoryRate: 14,
      radialPulsePalpable: false,
      respondsPurposefully: false,
    },
    expectedCategory: 'red',
    focusFields: [],
    tags: [],
  },
  {
    slug: 'new-af-30-kein-radialispuls',
    description:
      '33-jähriger Beifahrer, nach einem Verkehrsunfall aus dem Fahrzeug befreit, liegt am Boden. Blass, kaltschweißig, antwortet auf Fragen, keine äußere Blutung sichtbar. AF gezählt: 30/min, Radialispuls nicht tastbar (10 s geprüft).',
    reasoning:
      'AF 30/min ist bei Erwachsenen noch unauffällig (pathologisch erst > 30) → B trifft nicht zu. Kein Radialispuls tastbar → SK 1 (C). Schockzeichen ohne sichtbare Blutung: an innere Blutung denken.',
    findings: { ...defaultFindings(), respiratoryRate: 30, radialPulsePalpable: false },
    expectedCategory: 'red',
    focusFields: ['b', 'c'],
    tags: ['Verkehrsunfall', 'Grenzwert'],
  },

  // ── SK 1 – D: keine gezielte Reaktion auf Ansprache ──────────────
  {
    slug: 'legacy-15',
    description:
      '70-jährige Frau, liegt auf der Seite, Augen geschlossen, atmet ruhig und frei, keine Blutung sichtbar. Reagiert nicht auf Ansprache, auf Schmerzreiz nur ungezielte Abwehr. AF gezählt: 18/min, Radialispuls tastbar.',
    reasoning:
      'Keine gezielte Reaktion auf Ansprache (WASB < W) → SK 1 (D). Obwohl Atmung und Kreislauf unauffällig sind, reicht das Bewusstseinskriterium allein für SK 1.',
    findings: { ...defaultFindings(), respiratoryRate: 18, respondsPurposefully: false },
    expectedCategory: 'red',
    focusFields: ['d'],
    tags: [],
  },
  {
    slug: 'new-bewusstlos-normale-af',
    description:
      '67-jähriger Mann, nach einem Sturz im Gedränge, liegt auf dem Rücken, Augen geschlossen. Atmet ruhig und frei, keine Blutung sichtbar. AF gezählt: 16/min, Radialispuls kräftig tastbar, reagiert nicht auf Ansprache.',
    reasoning:
      'Keine gezielte Reaktion auf Ansprache (WASB < W) → SK 1 (D). Normale Atmung und tastbarer Puls verleiten zu SK 2 – der letzte Schritt wird leicht übersehen.',
    findings: { ...defaultFindings(), respiratoryRate: 16, respondsPurposefully: false },
    expectedCategory: 'red',
    focusFields: ['b', 'c', 'd'],
    tags: ['Massenpanik', 'Sturz', 'Falle'],
  },
  {
    slug: 'new-kind-af-40-reagiert-nicht',
    description:
      '4-jähriger Junge, aus einem verunfallten Reisebus geborgen, liegt schlaff am Boden, Augen geschlossen, keine Blutung sichtbar. Atmet frei, AF gezählt: 40/min, Radialispuls tastbar. Reagiert nicht auf Ansprache, auf Schmerzreiz nur ungezieltes Wimmern.',
    reasoning:
      'AF 40/min ist bei Kindern noch unauffällig (pathologisch erst > 40) → B trifft nicht zu. Radialispuls tastbar. Keine gezielte Reaktion auf Ansprache → SK 1 (D).',
    findings: {
      ...defaultFindings(),
      ageGroup: 'child',
      respiratoryRate: 40,
      respondsPurposefully: false,
    },
    expectedCategory: 'red',
    focusFields: ['b', 'd'],
    tags: ['Kind', 'Verkehrsunfall', 'Grenzwert'],
  },

  // ── SK 2 – kein SK-1-Kriterium ───────────────────────────────────
  {
    slug: 'legacy-6',
    description:
      '38-jähriger Mann, liegt am Boden, ansprechbar und orientiert. Offene Unterschenkelfraktur rechts, keine Blutungsproblematik. AF gezählt: 16/min, Radialispuls tastbar.',
    reasoning:
      'Keiner der SK-1-Punkte trifft zu (kein X/A/B/C/D-Problem) → SK 2 (aufgeschobene Behandlung). Patient verletzt, aber nicht unmittelbar vital gefährdet.',
    findings: { ...defaultFindings(), respiratoryRate: 16 },
    expectedCategory: 'yellow',
    focusFields: [],
    tags: [],
  },
  {
    slug: 'legacy-16',
    description:
      '45-jähriger Mann, sitzt am Boden, kann nicht aufstehen. Geschlossene Oberschenkelfraktur links, starke Schmerzen, keine Blutung. Ansprechbar, AF gezählt: 20/min, Radialispuls kräftig tastbar.',
    reasoning:
      'Trotz starker Schmerzen und Fraktur: Kein X/A/B/C/D-Problem → SK 2. Nicht gehfähig, aber nicht vital gefährdet. Häufiger Fehler: Schmerzpatienten werden zu hoch eingestuft.',
    findings: { ...defaultFindings(), respiratoryRate: 20 },
    expectedCategory: 'yellow',
    focusFields: [],
    tags: [],
  },
  {
    slug: 'legacy-17',
    description:
      '55-jährige Frau, nicht gehfähig, Beckenschmerzen nach einem Sturz. Wach, orientiert, AF gezählt: 14/min, Radialispuls tastbar. Keine äußere Blutung sichtbar.',
    reasoning:
      'Kein X/A/B/C/D-Problem → SK 2. Achtung: Beckenfrakturen können innere Blutungen verursachen – in der VOR-Sichtung wird aber nur nach den erhobenen Befunden entschieden.',
    findings: { ...defaultFindings(), respiratoryRate: 14 },
    expectedCategory: 'yellow',
    focusFields: ['c'],
    tags: ['Sturz', 'Falle'],
  },
  {
    slug: 'legacy-18',
    description:
      '19-jähriger Mann, kann nach einem Sprung aus dem Fenster nicht aufstehen, Schmerzen im Rücken. Wach und voll orientiert, keine Blutung sichtbar. AF gezählt: 16/min, Radialispuls tastbar, bewegt alle Extremitäten.',
    reasoning:
      'Kein X/A/B/C/D-Problem → SK 2. Obwohl der Unfallmechanismus (Sturz aus Höhe) gefährlich klingt, zeigt die VOR-Sichtung keine akute vitale Bedrohung. Die vollständige Sichtung kann anders bewerten.',
    findings: { ...defaultFindings(), respiratoryRate: 16 },
    expectedCategory: 'yellow',
    focusFields: [],
    tags: ['Sturz'],
  },
  {
    slug: 'new-af-10',
    description:
      '58-jährige Frau, in der Menschenmenge auf einer Treppe gestürzt, kann wegen Knöchelschmerzen nicht auftreten. Wach und orientiert, keine Blutung. AF gezählt: 10/min, Radialispuls tastbar.',
    reasoning:
      'AF 10/min ist bei Erwachsenen noch unauffällig (pathologisch erst < 10). Kein weiteres SK-1-Kriterium → SK 2.',
    findings: { ...defaultFindings(), respiratoryRate: 10 },
    expectedCategory: 'yellow',
    focusFields: ['b'],
    tags: ['Massenpanik', 'Sturz', 'Grenzwert'],
  },
  {
    slug: 'new-kind-af-15',
    description:
      '7-jähriger Junge, nach einem Sturz von einer Tribüne, liegt am Boden und kann nicht aufstehen; der rechte Unterschenkel ist deutlich fehlgestellt. Wach, weint, antwortet auf Fragen, keine Blutung. AF gezählt: 15/min, Radialispuls tastbar.',
    reasoning:
      'AF 15/min ist bei Kindern noch unauffällig (pathologisch erst < 15). Kein weiteres SK-1-Kriterium → SK 2.',
    findings: { ...defaultFindings(), ageGroup: 'child', respiratoryRate: 15 },
    expectedCategory: 'yellow',
    focusFields: ['b'],
    tags: ['Kind', 'Sturz', 'Grenzwert'],
  },
]
