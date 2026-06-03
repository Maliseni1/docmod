FROM node:20-slim

# Prevent interactive prompts during apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pandoc \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-common \
    fonts-liberation \
    fonts-dejavu \
    # Lightweight LaTeX for Pandoc PDF fallback
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-plain-generic \
    lmodern \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Verify binaries are in PATH
RUN which pandoc && which libreoffice || which soffice

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 10000

CMD ["node", "src/app.js"]