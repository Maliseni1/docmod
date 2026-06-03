FROM node:20

ENV DEBIAN_FRONTEND=noninteractive

# Update and install everything in one layer
RUN apt-get update && apt-get install -y \
    pandoc \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-common \
    fonts-liberation \
    fonts-dejavu \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-plain-generic \
    lmodern \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && which pandoc \
    && which soffice || which libreoffice

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads

EXPOSE 10000

CMD ["node", "src/app.js"]