FROM node:18-alpine

WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install --production

# Anwendungsdateien kopieren
COPY . .

# Stellen Sie sicher, dass die benötigten Verzeichnisse existieren
RUN mkdir -p /app/logs

# Port freigeben
EXPOSE 3001 9600/udp 8081

# Anwendung starten
CMD ["node", "index.js"] 