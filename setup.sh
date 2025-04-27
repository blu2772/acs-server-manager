#!/bin/bash

# Farbdefinitionen für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Keine Farbe

# Funktion zum Ausgeben von Statusmeldungen
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Funktion zum Ausgeben von Erfolgsmeldungen
print_success() {
    echo -e "${GREEN}[ERFOLG]${NC} $1"
}

# Funktion zum Ausgeben von Warnungen
print_warning() {
    echo -e "${YELLOW}[WARNUNG]${NC} $1"
}

# Funktion zum Ausgeben von Fehlern
print_error() {
    echo -e "${RED}[FEHLER]${NC} $1"
}

# Funktion zum Überprüfen von Befehlen
check_command() {
    command -v $1 >/dev/null 2>&1 || { 
        print_error "$1 ist nicht installiert. Bitte installieren Sie es zuerst."; 
        exit 1; 
    }
}

# Banner anzeigen
echo -e "${BLUE}"
echo "======================================================================"
echo "     ASSETTO CORSA SERVER MANAGER - INSTALLATIONS-SCRIPT              "
echo "======================================================================"
echo -e "${NC}"

# Prüfen, ob grundlegende Befehle vorhanden sind
print_status "Prüfe benötigte Befehle..."
check_command curl
check_command unzip
check_command node
check_command npm

# Aktuelles Verzeichnis speichern
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Server-Verzeichnis löschen, falls es existiert
if [ -d "server" ]; then
    print_status "Entferne vorhandenes Server-Verzeichnis..."
    rm -rf server
    if [ $? -ne 0 ]; then
        print_error "Konnte das Server-Verzeichnis nicht entfernen. Bitte überprüfen Sie die Berechtigungen."
        exit 1
    fi
fi

# Server-ZIP herunterladen
print_status "Lade Assetto Corsa Server herunter von https://timrmp.de/acs/server.zip..."
curl -L -o server.zip https://timrmp.de/acs/server.zip
if [ $? -ne 0 ]; then
    print_error "Download fehlgeschlagen. Bitte überprüfen Sie die URL oder Ihre Internetverbindung."
    exit 1
fi
print_success "Download abgeschlossen."

# Entpacken der ZIP-Datei
print_status "Entpacke Server-Dateien..."
unzip -q server.zip
if [ $? -ne 0 ]; then
    print_error "Entpacken fehlgeschlagen. Die ZIP-Datei könnte beschädigt sein."
    exit 1
fi
print_success "Entpacken abgeschlossen."

# Überprüfen, ob das server-Verzeichnis existiert
if [ ! -d "server" ]; then
    print_error "Nach dem Entpacken wurde kein 'server'-Verzeichnis gefunden. Die ZIP-Struktur könnte falsch sein."
    exit 1
fi

# ZIP-Datei entfernen
print_status "Entferne ZIP-Datei..."
rm server.zip
print_success "ZIP-Datei entfernt."

# Ausführungsrechte für Linux-Executable setzen
if [ -f "server/acServer" ]; then
    print_status "Setze Ausführungsrechte für acServer..."
    chmod +x server/acServer
    print_success "Ausführungsrechte gesetzt."
else
    print_warning "acServer-Datei nicht gefunden. Wird möglicherweise später erstellt."
fi

# Backend-Installation
print_status "Installiere Backend-Abhängigkeiten..."
cd "$SCRIPT_DIR/backend"
npm install
if [ $? -ne 0 ]; then
    print_error "Backend-Installation fehlgeschlagen. Bitte überprüfen Sie die Fehlermeldungen."
    exit 1
fi
print_success "Backend-Abhängigkeiten installiert."

# Frontend-Installation
print_status "Installiere Frontend-Abhängigkeiten..."
cd "$SCRIPT_DIR/frontend"
npm install
if [ $? -ne 0 ]; then
    print_error "Frontend-Installation fehlgeschlagen. Bitte überprüfen Sie die Fehlermeldungen."
    exit 1
fi
print_success "Frontend-Abhängigkeiten installiert."

# Frontend bauen
print_status "Erstelle Frontend-Build für Produktion..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend-Build fehlgeschlagen. Bitte überprüfen Sie die Fehlermeldungen."
    exit 1
fi
print_success "Frontend-Build erfolgreich erstellt."

# Zurück zum Hauptverzeichnis
cd "$SCRIPT_DIR"

# .env-Datei überprüfen und ggf. anpassen
print_status "Überprüfe .env-Datei im Backend..."
if [ ! -f "backend/.env" ]; then
    print_status "Erstelle .env-Datei im Backend..."
    cat > backend/.env << EOF
# Server-Konfiguration
PORT=3001

# Pfad zum Assetto Corsa Server
# Der tatsächliche Pfad, wo sich der acServer befindet
SERVER_PATH=./server

# Maximale Dateigröße für Uploads in MB
MAX_FILE_SIZE=500

# JWT-Secret für Authentifizierung (falls implementiert)
JWT_SECRET=your-secret-key-change-this-in-production
EOF
    print_success ".env-Datei erstellt."
else
    # Überprüfen und aktualisieren des SERVER_PATH in der .env-Datei
    if grep -q "SERVER_PATH=" backend/.env; then
        sed -i 's|^SERVER_PATH=.*|SERVER_PATH=./server|' backend/.env
        print_success "SERVER_PATH in .env-Datei aktualisiert."
    else
        echo "SERVER_PATH=./server" >> backend/.env
        print_success "SERVER_PATH zur .env-Datei hinzugefügt."
    fi
fi

# Start-Skript erstellen
print_status "Erstelle Start-Skript..."
cat > start.sh << EOF
#!/bin/bash

# Farbdefinitionen
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Backend starten
echo -e "\${BLUE}Starte Backend...\${NC}"
cd backend
npm start &
BACKEND_PID=\$!
echo -e "\${GREEN}Backend gestartet mit PID \$BACKEND_PID\${NC}"

# Kurz warten, damit das Backend gestartet ist
sleep 2

# Frontend starten
echo -e "\${BLUE}Starte Frontend...\${NC}"
cd ../frontend
npm start &
FRONTEND_PID=\$!
echo -e "\${GREEN}Frontend gestartet mit PID \$FRONTEND_PID\${NC}"

echo -e "\${GREEN}Alle Dienste gestartet.\${NC}"
echo -e "\${BLUE}Frontend ist erreichbar unter: http://localhost:3000\${NC}"
echo -e "\${BLUE}Backend-API ist erreichbar unter: http://localhost:3001\${NC}"
echo -e "\${BLUE}Drücken Sie CTRL+C zum Beenden aller Dienste.\${NC}"

# Trap für sauberes Beenden
trap 'echo -e "\${BLUE}Beende alle Dienste...\${NC}"; kill \$BACKEND_PID \$FRONTEND_PID 2>/dev/null; echo -e "\${GREEN}Alle Dienste beendet.\${NC}"; exit 0' INT

# Warten auf CTRL+C
wait
EOF

chmod +x start.sh
print_success "Start-Skript erstellt und ausführbar gemacht."

echo -e "${GREEN}"
echo "======================================================================"
echo "     INSTALLATION ERFOLGREICH ABGESCHLOSSEN                           "
echo "======================================================================"
echo -e "${NC}"
echo -e "Die Installation des Assetto Corsa Server Managers wurde erfolgreich abgeschlossen."
echo -e "Sie können die Anwendung starten mit: ${YELLOW}./start.sh${NC}"
echo -e ""
echo -e "Das Frontend wird dann unter ${BLUE}http://localhost:3000${NC} erreichbar sein."
echo -e "Das Backend wird unter ${BLUE}http://localhost:3001${NC} erreichbar sein."
echo -e ""
echo -e "Um die Anwendung zu beenden, drücken Sie ${YELLOW}CTRL+C${NC} im Terminal." 