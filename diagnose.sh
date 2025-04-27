#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}=== Assetto Corsa Server Manager Diagnose ===${NC}"
echo

# Überprüfe Berechtigungen des Server-Verzeichnisses
echo -e "${BLUE}Überprüfe Berechtigungen des Server-Verzeichnisses...${NC}"
echo "Benutzer und Gruppe:"
ls -ld server
echo "Inhalt des Content-Verzeichnisses:"
ls -la server/content/
echo "Berechtigungen der Auto-Verzeichnisse:"
ls -la server/content/cars | head -n 10
echo "Berechtigungen der Strecken-Verzeichnisse:"
ls -la server/content/tracks | head -n 10
echo

# Überprüfe absoluten Pfad 
echo -e "${BLUE}Überprüfe absoluten Pfad des Server-Verzeichnisses...${NC}"
ABSOLUTE_PATH=$(cd server && pwd)
echo "Absoluter Pfad: $ABSOLUTE_PATH"
echo

# Überprüfe Backend-Konfiguration
echo -e "${BLUE}Überprüfe Backend-Konfiguration...${NC}"
if grep -q "SERVER_PATH=" backend/.env; then
    SERVER_PATH_VALUE=$(grep "SERVER_PATH=" backend/.env | cut -d'=' -f2)
    echo "SERVER_PATH in .env: $SERVER_PATH_VALUE"
    
    # Prüfe, ob relativer Pfad korrekt ist
    if [[ "$SERVER_PATH_VALUE" == "./server" ]]; then
        EXPECTED_PATH=$(cd backend && cd ./server 2>/dev/null && pwd || echo "PFAD NICHT ZUGÄNGLICH")
        echo "Dies würde beim Start des Backends zu folgendem Pfad aufgelöst: $EXPECTED_PATH"
        
        if [[ "$EXPECTED_PATH" == "PFAD NICHT ZUGÄNGLICH" ]]; then
            echo -e "${RED}WARNUNG: Der relative Pfad ist vom Backend-Verzeichnis aus nicht zugänglich!${NC}"
            echo -e "${YELLOW}Empfehlung: Ändern Sie SERVER_PATH in .env auf einen absoluten Pfad${NC}"
        fi
    fi
else
    echo -e "${RED}SERVER_PATH nicht in .env-Datei gefunden!${NC}"
fi
echo

# Überprüfe, ob die Content-Services korrekt auf die Verzeichnisse zugreifen können
echo -e "${BLUE}Teste Zugriff auf Auto- und Streckenverzeichnisse...${NC}"
echo "Anzahl der Autos im Verzeichnis:"
if [ -d "server/content/cars" ]; then
    CAR_COUNT=$(find server/content/cars -maxdepth 1 -type d | wc -l)
    echo "Gefundene Auto-Verzeichnisse: $((CAR_COUNT-1))"
    echo "Erste 5 Einträge:"
    ls -1 server/content/cars | head -n 5
else
    echo -e "${RED}Auto-Verzeichnis nicht gefunden!${NC}"
fi

echo "Anzahl der Strecken im Verzeichnis:"
if [ -d "server/content/tracks" ]; then
    TRACK_COUNT=$(find server/content/tracks -maxdepth 1 -type d | wc -l)
    echo "Gefundene Strecken-Verzeichnisse: $((TRACK_COUNT-1))"
    echo "Erste 5 Einträge:"
    ls -1 server/content/tracks | head -n 5
else
    echo -e "${RED}Strecken-Verzeichnis nicht gefunden!${NC}"
fi
echo

# Teste die API-Endpunkte
echo -e "${BLUE}Teste API-Endpunkte (Backend muss laufen)...${NC}"
echo "GET /api/content/cars:"
CARS_RESPONSE=$(curl -s http://localhost:3001/api/content/cars)
if [[ $CARS_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}Erfolgreich!${NC}"
    # Extrahiere die Anzahl der Autos aus der JSON-Antwort
    if command -v jq &> /dev/null; then
        CARS_COUNT=$(echo $CARS_RESPONSE | jq '.cars | length')
        echo "Anzahl der Autos in API-Antwort: $CARS_COUNT"
    else
        echo "Anzahl der Autos kann nicht angezeigt werden (jq nicht installiert)"
    fi
else
    echo -e "${RED}Fehler beim Abrufen der Autos:${NC}"
    echo "$CARS_RESPONSE"
fi

echo "GET /api/content/tracks:"
TRACKS_RESPONSE=$(curl -s http://localhost:3001/api/content/tracks)
if [[ $TRACKS_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}Erfolgreich!${NC}"
    # Extrahiere die Anzahl der Strecken aus der JSON-Antwort
    if command -v jq &> /dev/null; then
        TRACKS_COUNT=$(echo $TRACKS_RESPONSE | jq '.tracks | length')
        echo "Anzahl der Strecken in API-Antwort: $TRACKS_COUNT"
    else
        echo "Anzahl der Strecken kann nicht angezeigt werden (jq nicht installiert)"
    fi
else
    echo -e "${RED}Fehler beim Abrufen der Strecken:${NC}"
    echo "$TRACKS_RESPONSE"
fi
echo

echo -e "${BLUE}Diagnose abgeschlossen.${NC}"
echo -e "${YELLOW}Wenn die API keine oder falsche Daten zurückgibt, überprüfen Sie die Backend-Logs auf Fehler.${NC}"
echo -e "${YELLOW}Um die Backend-Logs zu sehen, führen Sie 'cd backend && npm start' aus und beobachten Sie die Konsolenausgabe.${NC}" 