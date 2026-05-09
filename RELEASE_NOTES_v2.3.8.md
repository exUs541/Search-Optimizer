# Release Notes - Search Filter & Site Blocker v2.3.8

## Überblick
In diesem Update wurde der Fokus auf die Verbesserung der Benutzeroberfläche (UI), die Bereinigung der Projektstruktur und die Einführung neuer Filter-Optionen gelegt.

## Neuerungen & Verbesserungen

### 📂 Projekt-Struktur & Cleanup
- **Versions-Historie**: Alle alten Release-ZIP-Dateien wurden aus dem Root-Verzeichnis in den neuen Ordner `versionhistory/` verschoben, um die Übersichtlichkeit des Projekts zu erhöhen.
- **Dateibereinigung**: Unnötige Assets (wie alte Banner) wurden entfernt.

### ✨ Benutzeroberfläche (UI)
- **Interaktive Collapsibles**: Die ausklappbaren Bereiche im Popup verfügen nun über Pfeil-Icons, die bei Betätigung rotieren (90° Drehung), was die Benutzerführung verbessert.
- **Modernisiertes Popup**: Optimierung der Abstände und Symbole für ein konsistenteres Design.
- **Eye-Button Logik**: Verbesserte visuelle Rückmeldung beim Ausblenden von Modulen.

### 🚀 Neue Funktionen
- **"Unpack More" Tab-Steuerung**: Nutzer können nun gezielt den "Mehr entdecken" / "Unpack More" Tab in den Google-Suchergebnissen ein- oder ausblenden.
- **Erweiterter Fun-Tab**: Die Buttons im Fun-Bereich unterstützen nun auch direkte Links zu Browser-Erweiterungen (Extension-URLs).

### 🛠 Technische Optimierungen & Fixes
- **Asynchrone Speicherung**: Umstellung der Speicherlogik auf `async/await` für eine zuverlässigere Verarbeitung der Einstellungen.
- **Verbesserter Inhalts-Filter**: Die Logik zum Filtern von "Short Videos" und anderen Google-Modulen wurde präzisiert.
- **Live-Update Mechanismus**: Optimierte Übertragung von Einstellungsänderungen an aktive Google-Tabs ohne Seiten-Reload.
- **Export-Funktion**: Der Standard-Dateiname beim Exportieren der Einstellungen enthält nun automatisch die aktuelle Versionsnummer (v2.3.8).

---
*Gepusht am 09.05.2026*
