# Release Notes - Search Filter & Site Blocker v2.3.9

## Überblick
In diesem Update wurde das Design des Einstellungs-Popups weiter optimiert, um eine kompaktere und übersichtlichere Darstellung der Farboptionen zu ermöglichen. Zudem wurden technische Refactorings durchgeführt.

## Neuerungen & Verbesserungen

### ✨ Design & UI
- **2-Spalten Layout für Farben**: Im Reiter "Design" werden die HEX-Farbeinstellungen (Primary, Background, Accent BG, etc.) nun in zwei Spalten nebeneinander angezeigt. Dies spart vertikalen Platz und verbessert die Übersicht.
- **Optimierte Steuerung**: Die Farbwähler und HEX-Eingabefelder wurden neu angeordnet (Label über den Eingabefeldern), um in das kompakte Grid zu passen.
- **CSS Cleanup**: Entfernung von redundantem Code und Konsolidierung der Grid-Logik.

### 🛠 Technische Refactorings (aus v2.3.8 übernommen/verfeinert)
- **Robustes Listen-Rendering**: Die Verwaltung von blockierten Domains und Keywords wurde stabilisiert, um Index-Fehler beim Löschen zu vermeiden.
- **Export/Import Fixes**: Verbesserte Fehlerbehandlung beim Importieren von Konfigurationsdateien und automatische Bereinigung des Speichers vor dem Import.

---
*Gepusht am 09.05.2026*
