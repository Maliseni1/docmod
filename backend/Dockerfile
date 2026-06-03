FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pandoc \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 10000

CMD ["node", "src/app.js"]