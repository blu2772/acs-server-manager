# Assetto Corsa Server Manager

Eine moderne Web-Anwendung zur Verwaltung eines Assetto Corsa Dedicated Servers. Mit dieser Anwendung können Sie Auto- und Strecken-Mods hochladen, den Server konfigurieren und steuern.

## Funktionen

- 🚗 **Mod-Verwaltung**: Hochladen und Verwalten von Auto- und Strecken-Mods
- ⚙️ **Server-Konfiguration**: Einfache Anpassung der Server-Einstellungen über die Web-Oberfläche
- 🏎️ **Entry-List-Verwaltung**: Konfiguration der verfügbaren Autos und Skins
- 🖥️ **Server-Steuerung**: Starten, Stoppen und Überwachen des Servers
- 📊 **Dashboard**: Übersicht über den Server-Status und verfügbare Inhalte

## Voraussetzungen

- Node.js (v16 oder höher)
- npm (normalerweise mit Node.js installiert)
- curl (für das Setup-Script)
- unzip (für Linux/Mac) oder PowerShell (für Windows)

## Schnellinstallation

Wir bieten Scripts an, die den gesamten Installationsprozess automatisieren:

### Unter Linux/Mac

```bash
# Führen Sie das Setup-Script aus
chmod +x setup.sh
./setup.sh

# Nach der Installation starten Sie die Anwendung mit
./start.sh
```

### Unter Windows

```
# Führen Sie das Setup-Batch-Script aus
setup.bat

# Nach der Installation starten Sie die Anwendung mit
start.bat
```

Das Setup-Script erledigt folgende Aufgaben für Sie:
1. Herunterlädt den Assetto Corsa Server
2. Entpackt die Serverfiles
3. Installiert alle notwendigen Abhängigkeiten
4. Erstellt einen Produktions-Build des Frontends
5. Konfiguriert die Anwendung
6. Erstellt ein Start-Script für den einfachen Start

## Manuelle Installation

Falls Sie die Installation lieber manuell durchführen möchten:

### 1. Repository klonen

```bash
git clone https://github.com/yourusername/acs-server-manager.git
cd acs-server-manager
```

### 2. Assetto Corsa Server herunterladen und entpacken

```bash
# Server herunterladen
curl -L -o server.zip https://timrmp.de/acs/server.zip

# Entpacken
unzip server.zip

# Unter Linux: Ausführungsrechte setzen für den Server
chmod +x server/acServer
```

### 3. Backend einrichten

```bash
cd backend
npm install

# .env-Datei erstellen
echo "PORT=3001
SERVER_PATH=./server
MAX_FILE_SIZE=500
JWT_SECRET=your-secret-key-change-this-in-production" > .env
```

### 4. Frontend einrichten

```bash
cd ../frontend
npm install
```

### 5. Anwendung starten

In zwei separaten Terminals:

```bash
# Terminal 1 (Backend)
cd backend
npm start

# Terminal 2 (Frontend)
cd frontend
# Für Entwicklung:
npm run dev
# Oder für Produktion:
npm run build
npm start
```

## Verwendung

Nach dem Start der Anwendung können Sie den Assetto Corsa Server Manager wie folgt erreichen:

- **Frontend**: http://localhost:3000
- **Backend-API**: http://localhost:3001

### Hauptfunktionen

1. **Dashboard**: Übersicht über den Server-Status und vorhandene Inhalte
2. **Autos**: Verwaltung der verfügbaren Fahrzeuge
3. **Strecken**: Verwaltung der verfügbaren Strecken und Layouts
4. **Upload**: Hochladen neuer Auto- und Strecken-Mods (als ZIP-Dateien)
5. **Konfiguration**: Anpassung der Server-Einstellungen und Entry-List
6. **Server-Steuerung**: Starten, Stoppen und Überwachen des Servers mit Logs

## Hinweise zur Mod-Installation

### Auto-Mods

- Hochladen einer ZIP-Datei, die einen Hauptordner enthält (z.B. `ks_ferrari_488`)
- Dieser Ordner sollte die Auto-Daten und einen `skins`-Ordner enthalten

### Strecken-Mods

- Hochladen einer ZIP-Datei, die einen Hauptordner enthält (z.B. `spa`)
- Dieser Ordner sollte die Streckendaten und optional einen `layouts`-Ordner enthalten

## Fehlerbehebung

### Server startet nicht

1. Überprüfen Sie die Berechtigungen des acServer-Executables (`chmod +x server/acServer`)
2. Prüfen Sie die Server-Logs in der Server-Steuerungs-Ansicht
3. Stellen Sie sicher, dass die Konfiguration korrekte Strecken- und Auto-IDs enthält

### Frontend- oder Backend-Fehler

1. Prüfen Sie, ob die benötigten Ports (3000 und 3001) nicht bereits belegt sind
2. Prüfen Sie die Terminal-Ausgabe auf Fehlermeldungen
3. Stellen Sie sicher, dass Node.js v16 oder höher installiert ist

## Lizenz

MIT

## Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue auf GitHub. 