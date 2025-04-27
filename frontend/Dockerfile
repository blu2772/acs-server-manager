FROM node:18-alpine AS builder

WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# Anwendungsdateien kopieren
COPY . .

# Next.js-Anwendung bauen
RUN npm run build

# Produktions-Image
FROM node:18-alpine

WORKDIR /app

# Nur die nötigen Dateien kopieren
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Port freigeben
EXPOSE 3000

# Anwendung starten
CMD ["npm", "start"] 