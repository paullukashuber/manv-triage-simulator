# Seed-Fälle prüfen und freigeben

Checkliste für den Betreiber. Beim ersten Start legt die API 33 Fälle an (18 migrierte Altfälle `legacy-<id>`,
15 neue `new-*`). Im Betrieb (`SEED_PUBLISH=false`) sind **alle Seed-Fälle Entwürfe**; erst veröffentlichte
Revisionen erscheinen im Training. Jeder Fall wird im Fall-Editor geprüft und dann veröffentlicht.
Das Veröffentlichen geht nur, wenn die hinterlegte Soll-Kategorie zur berechneten Kategorie passt; die Live-Vorschau
im Editor zeigt beides nebeneinander.

Die fachlichen Inhalte sind Trainingsmaterial und noch nicht abschließend geprüft. Im Zweifel gilt das aktuelle
offizielle Schulungsmaterial.

## Alle Fälle

Die Tabelle ist aus `apps/api/src/seed/cases.ts` erzeugt. „Entscheidender Schritt“ ist der erste zutreffende
Schritt des Algorithmus; bei SK 2 trifft keiner zu (Rückfallebene).

| Slug | Kategorie | Entscheidender Schritt | Kind | Tags |
|---|---|---|---|---|
| `legacy-1` | PAK weiß | Gehfähig | nein | Verkehrsunfall |
| `legacy-9` | PAK weiß | Gehfähig | nein | Falle |
| `legacy-10` | PAK weiß | Gehfähig | nein | – |
| `new-gehfaehig-splitterwunde` | PAK weiß | Gehfähig | nein | Explosion, Falle |
| `legacy-4` | Tot | Sichere Todeszeichen | nein | – |
| `legacy-11` | Tot | Sichere Todeszeichen | nein | – |
| `legacy-3` | SK 1 (rot) | X: Tourniquet | nein | – |
| `new-gehfaehig-spritzende-blutung` | SK 1 (rot) | X: Tourniquet | nein | Explosion, Falle |
| `new-oberarm-blutlache` | SK 1 (rot) | X: Tourniquet | nein | Verkehrsunfall |
| `legacy-7` | SK 1 (rot) | A: Stridor | nein | Brand |
| `new-stridor-normale-af` | SK 1 (rot) | A: Stridor | nein | Brand, Falle |
| `legacy-12` | SK 1 (rot) | A: Atemweg verlegt | nein | Sturz |
| `new-gurgelnder-fahrer` | SK 1 (rot) | A: Atemweg verlegt | nein | Verkehrsunfall |
| `legacy-5` | SK 1 (rot) | B: Atemfrequenz | ja | Kind |
| `legacy-8` | SK 1 (rot) | B: Atemfrequenz | nein | – |
| `legacy-13` | SK 1 (rot) | B: Atemfrequenz | nein | Verkehrsunfall |
| `new-af-9` | SK 1 (rot) | B: Atemfrequenz | nein | Massenpanik, Grenzwert |
| `new-af-31` | SK 1 (rot) | B: Atemfrequenz | nein | Massenpanik, Grenzwert |
| `new-kind-af-14` | SK 1 (rot) | B: Atemfrequenz | ja | Kind, Massenpanik, Grenzwert |
| `new-kind-af-41` | SK 1 (rot) | B: Atemfrequenz | ja | Kind, Verkehrsunfall, Grenzwert |
| `legacy-14` | SK 1 (rot) | C: starke Blutung | nein | Falle |
| `new-flankenblutung` | SK 1 (rot) | C: starke Blutung | nein | Explosion, Falle |
| `legacy-2` | SK 1 (rot) | C: kein Radialispuls | nein | – |
| `new-af-30-kein-radialispuls` | SK 1 (rot) | C: kein Radialispuls | nein | Verkehrsunfall, Grenzwert |
| `legacy-15` | SK 1 (rot) | D: reagiert nicht gezielt | nein | – |
| `new-bewusstlos-normale-af` | SK 1 (rot) | D: reagiert nicht gezielt | nein | Massenpanik, Sturz, Falle |
| `new-kind-af-40-reagiert-nicht` | SK 1 (rot) | D: reagiert nicht gezielt | ja | Kind, Verkehrsunfall, Grenzwert |
| `legacy-6` | SK 2 (gelb) | keiner (Rückfallebene) | nein | – |
| `legacy-16` | SK 2 (gelb) | keiner (Rückfallebene) | nein | – |
| `legacy-17` | SK 2 (gelb) | keiner (Rückfallebene) | nein | Sturz, Falle |
| `legacy-18` | SK 2 (gelb) | keiner (Rückfallebene) | nein | Sturz |
| `new-af-10` | SK 2 (gelb) | keiner (Rückfallebene) | nein | Massenpanik, Sturz, Grenzwert |
| `new-kind-af-15` | SK 2 (gelb) | keiner (Rückfallebene) | ja | Kind, Sturz, Grenzwert |

## Geänderte Altfälle

Alle 18 Altfälle wurden gegen `src/data/scenarios.js` der Version 0.2 geprüft. Neu bei allen: Tags und
Prüffelder (`focusFields`); `respiratoryRate` enthält die Atemfrequenz aus dem Text. Die Soll-Kategorie
entspricht bei allen Fällen der alten richtigen Kategorie. Reine Grammatikänderungen sind als „Wortlaut“ markiert.

- **legacy-1:** Beschreibung ergänzt „kann selbstständig gehen“ (alt nur „steht“). Begründung unverändert. Tag Verkehrsunfall.
- **legacy-2:** Beschreibung ergänzt „frei“ (Atmung), „AF gezählt: 14/min“ (alt nur „atmet regelmäßig“) und „Keine äußere Blutung sichtbar“; „10 Sek.“ wird „10 s“. Begründung neu: C entscheidet, D (Bewusstlosigkeit) wird nicht mehr geprüft.
- **legacy-3:** Beschreibung neu: „nicht gehfähig“ wird „liegt am Boden“, „Massive arterielle Blutung am rechten Oberschenkel“ wird „spritzt hellrotes Blut, die Hose ist blutdurchtränkt“. Begründung neu: Tourniquet, Zeit notieren, SK 1 bei X (nicht C). Prüffeld X.
- **legacy-4:** Beschreibung unverändert. Begründung Wortlaut („+“ zu „und“, „tot“ zu „Tot“). Befunde nach dem entscheidenden Schritt geändert: kein Radialispuls, reagiert nicht gezielt (alt in den Antworten jeweils „nein“, d. h. Schritt nicht zutreffend).
- **legacy-5:** Beschreibung ergänzt „sitzt nach dem Unfall am Boden und kann nicht aufstehen“ (alt war Gehunfähigkeit nicht festgelegt), „an Armen und Beinen“ (Schürfwunden) und „keine starke Blutung“. Begründung ergänzt „(B)“. Tag Kind.
- **legacy-6:** Beschreibung Wortlaut („AF gezählt: 16/min“). Begründung: „A/B/C/D“ wird „X/A/B/C/D“.
- **legacy-7:** Beschreibung ergänzt „liegt am Boden und kann nicht gehen“; „stridoröses Atemgeräusch“ wird „pfeifendes Atemgeräusch beim Einatmen“ (das Wort „stridorös“ nannte den Befund). Tag Brand.
- **legacy-8:** Beschreibung ergänzt „Keine sichtbare Blutung, Atemwege frei“; „sehr langsam: 7/min“ wird „AF gezählt: 7/min“. Begründung: „vital gefährdet“ ersetzt durch den Hinweis, dass B vor D entscheidet.
- **legacy-9:** Beschreibung unverändert. Begründung ergänzt „keine Extremitätenblutung“ (X-Begründung); „gehen immer zur Sammelstelle“ wird „gehen zur Sammelstelle“, weil X vor Gehfähigkeit steht. Prüffeld Gehfähigkeit, Tag Falle.
- **legacy-10:** unverändert.
- **legacy-11:** Wortlaut. Befunde nach dem entscheidenden Schritt wie bei legacy-4 geändert.
- **legacy-12:** Beschreibung ergänzt „liegt … am Boden“; der Satz „Ohne Maßnahmen droht Atemwegsverlegung.“ entfällt, weil er die Antwort verriet. Tag Sturz.
- **legacy-13:** Beschreibung ergänzt „kann nicht aufstehen“ und „keine äußere Blutung“; „nach einem Motorradunfall“. Tag Verkehrsunfall.
- **legacy-14:** Beschreibung ergänzt „liegt am Boden“ und „AF gezählt: 24/min“ (B liegt auf dem Weg), Satzreihenfolge geändert. Begründung ergänzt, dass X nicht zutrifft (keine Extremität betroffen). Prüffelder X und C, Tag Falle.
- **legacy-15:** Beschreibung ergänzt „atmet ruhig und frei“ und „keine Blutung sichtbar“; „auf Schmerzreiz nur ungezielte Abwehr“; „AF gezählt: 18/min“. Prüffeld D.
- **legacy-16:** Beschreibung ergänzt „keine Blutung“. Begründung: „X/A/B/C/D“, „zu hoch eingestuft“.
- **legacy-17:** Wortlaut. Begründung: „X/A/B/C/D“; „nach den erhobenen Befunden“ statt „nach sichtbaren Befunden“ (leichte Bedeutungsverschiebung). Prüffeld C, Tags Sturz und Falle.
- **legacy-18:** Beschreibung ergänzt „keine Blutung sichtbar“, Satzstellung geändert („kann nach einem Sprung aus dem Fenster nicht aufstehen“). Begründung: „kann“ statt „könnte“. Tag Sturz.

## Hinweise zur fachlichen Prüfung

- **Bewusstlos, aber „atmet frei“ (`new-bewusstlos-normale-af`, `legacy-2`):** Die Begründung sagt noch nicht,
  warum A nicht zutrifft. Erwägen, „kein Schnarchen/Gurgeln“ in die Beschreibung aufzunehmen.
- **Kleinkind oder Kind:** Der Hinweistext zu B nennt „Kleinkinder“ (AF < 15 oder > 40/min), die Kinderwerte gelten
  aber für alle Kinder bis 10 Jahre; `new-kind-af-14` wird allein über die Altersgruppe entschieden.
  Altersgrenze bestätigen und ggf. Hinweistext oder Fälle anpassen.
- **Wortlaut:** `new-af-31` enthält einen Satz im Präteritum („wurde … gedrückt“). `new-af-10` sagt „kann … nicht
  auftreten“ statt „kann nicht gehen“. Bei `legacy-1` ist der Tag „Verkehrsunfall“ durch den Text nicht gedeckt.
- Die neuen Fälle (`new-*`) und die oben genannten Änderungen der Altfälle fachlich prüfen. Es wurden keine Regeln
  über den Algorithmus hinaus ergänzt; Lehrhinweise (Packing/Kompression, Esmarch, Seitenlage, innere Blutung)
  stammen aus den alten Texten.
- Fälle mit Tag `Falle` haben Prüffelder, die im Feedback auf die typische Fehlerquelle hinweisen.

Zum Betrieb siehe [deploy/README.md](../../deploy/README.md).
