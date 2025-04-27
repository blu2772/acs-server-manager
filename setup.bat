@echo off
setlocal enabledelayedexpansion

:: Farbdefinitionen für bessere Lesbarkeit
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

:: Banner anzeigen
echo %BLUE%
echo ======================================================================
echo      ASSETTO CORSA SERVER MANAGER - INSTALLATIONS-SCRIPT              
echo ======================================================================
echo %NC%

:: Prüfen, ob grundlegende Befehle vorhanden sind
echo %BLUE%[INFO]%NC% Prüfe benötigte Befehle...

where curl >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% curl ist nicht installiert. Bitte installieren Sie es zuerst.
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% node ist nicht installiert. Bitte installieren Sie es zuerst.
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% npm ist nicht installiert. Bitte installieren Sie es zuerst.
    exit /b 1
)

:: Server-Verzeichnis löschen, falls es existiert
if exist server (
    echo %BLUE%[INFO]%NC% Entferne vorhandenes Server-Verzeichnis...
    rmdir /s /q server
    if %ERRORLEVEL% neq 0 (
        echo %RED%[FEHLER]%NC% Konnte das Server-Verzeichnis nicht entfernen. Bitte überprüfen Sie die Berechtigungen.
        exit /b 1
    )
)

:: Server-ZIP herunterladen
echo %BLUE%[INFO]%NC% Lade Assetto Corsa Server herunter von https://timrmp.de/acs/server.zip...
curl -L -o server.zip https://timrmp.de/acs/server.zip
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% Download fehlgeschlagen. Bitte überprüfen Sie die URL oder Ihre Internetverbindung.
    exit /b 1
)
echo %GREEN%[ERFOLG]%NC% Download abgeschlossen.

:: Entpacken der ZIP-Datei
echo %BLUE%[INFO]%NC% Entpacke Server-Dateien...
powershell -command "Expand-Archive -Path server.zip -DestinationPath . -Force"
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% Entpacken fehlgeschlagen. Die ZIP-Datei könnte beschädigt sein.
    exit /b 1
)
echo %GREEN%[ERFOLG]%NC% Entpacken abgeschlossen.

:: Überprüfen, ob das server-Verzeichnis existiert
if not exist server (
    echo %RED%[FEHLER]%NC% Nach dem Entpacken wurde kein 'server'-Verzeichnis gefunden. Die ZIP-Struktur könnte falsch sein.
    exit /b 1
)

:: ZIP-Datei entfernen
echo %BLUE%[INFO]%NC% Entferne ZIP-Datei...
del server.zip
echo %GREEN%[ERFOLG]%NC% ZIP-Datei entfernt.

:: Backend-Installation
echo %BLUE%[INFO]%NC% Installiere Backend-Abhängigkeiten...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% Backend-Installation fehlgeschlagen. Bitte überprüfen Sie die Fehlermeldungen.
    exit /b 1
)
echo %GREEN%[ERFOLG]%NC% Backend-Abhängigkeiten installiert.

:: Frontend-Installation
echo %BLUE%[INFO]%NC% Installiere Frontend-Abhängigkeiten...
cd ..\frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% Frontend-Installation fehlgeschlagen. Bitte überprüfen Sie die Fehlermeldungen.
    exit /b 1
)
echo %GREEN%[ERFOLG]%NC% Frontend-Abhängigkeiten installiert.

:: Frontend bauen
echo %BLUE%[INFO]%NC% Erstelle Frontend-Build für Produktion...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo %RED%[FEHLER]%NC% Frontend-Build fehlgeschlagen. Bitte überprüfen Sie die Fehlermeldungen.
    exit /b 1
)
echo %GREEN%[ERFOLG]%NC% Frontend-Build erfolgreich erstellt.

:: Zurück zum Hauptverzeichnis
cd ..

:: .env-Datei überprüfen und ggf. anpassen
echo %BLUE%[INFO]%NC% Überprüfe .env-Datei im Backend...
if not exist backend\.env (
    echo %BLUE%[INFO]%NC% Erstelle .env-Datei im Backend...
    (
        echo # Server-Konfiguration
        echo PORT=3001
        echo.
        echo # Pfad zum Assetto Corsa Server
        echo # Der tatsächliche Pfad, wo sich der acServer befindet
        echo SERVER_PATH=./server
        echo.
        echo # Maximale Dateigröße für Uploads in MB
        echo MAX_FILE_SIZE=500
        echo.
        echo # JWT-Secret für Authentifizierung (falls implementiert)
        echo JWT_SECRET=your-secret-key-change-this-in-production
    ) > backend\.env
    echo %GREEN%[ERFOLG]%NC% .env-Datei erstellt.
) else (
    :: Hier könnte eine komplexere Ersetzung stehen, vereinfacht für Batch
    echo %BLUE%[INFO]%NC% .env-Datei existiert bereits. Stelle sicher, SERVER_PATH=./server ist korrekt gesetzt.
)

:: Start-Skript erstellen
echo %BLUE%[INFO]%NC% Erstelle Start-Skript...

(
    echo @echo off
    echo setlocal enabledelayedexpansion
    echo.
    echo set "GREEN=[92m"
    echo set "BLUE=[94m"
    echo set "NC=[0m"
    echo.
    echo :: Backend starten
    echo echo !BLUE!Starte Backend...!NC!
    echo cd backend
    echo start cmd /k "npm start"
    echo echo !GREEN!Backend gestartet!NC!
    echo.
    echo :: Kurz warten, damit das Backend gestartet ist
    echo timeout /t 2 /nobreak
    echo.
    echo :: Frontend starten
    echo echo !BLUE!Starte Frontend...!NC!
    echo cd ..\frontend
    echo start cmd /k "npm start"
    echo echo !GREEN!Frontend gestartet!NC!
    echo.
    echo echo !GREEN!Alle Dienste gestartet.!NC!
    echo echo !BLUE!Frontend ist erreichbar unter: http://localhost:3000!NC!
    echo echo !BLUE!Backend-API ist erreichbar unter: http://localhost:3001!NC!
    echo echo !BLUE!Um die Anwendung zu beenden, schließen Sie die Kommandozeilenfenster.!NC!
    echo.
    echo pause
) > start.bat

echo %GREEN%[ERFOLG]%NC% Start-Skript erstellt.

echo %GREEN%
echo ======================================================================
echo      INSTALLATION ERFOLGREICH ABGESCHLOSSEN                           
echo ======================================================================
echo %NC%
echo Die Installation des Assetto Corsa Server Managers wurde erfolgreich abgeschlossen.
echo Sie können die Anwendung starten mit: %YELLOW%start.bat%NC%
echo.
echo Das Frontend wird dann unter %BLUE%http://localhost:3000%NC% erreichbar sein.
echo Das Backend wird unter %BLUE%http://localhost:3001%NC% erreichbar sein.
echo.
echo Um die Anwendung zu beenden, schließen Sie die Kommandozeilenfenster.

pause 