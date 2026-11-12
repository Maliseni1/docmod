FROM node:20

ENV DEBIAN_FRONTEND=noninteractive

# Update and install everything in one layer
# PDF output goes through LibreOffice (soffice --headless --convert-to pdf),
# not a LaTeX engine, so TeX Live is intentionally not installed here -
# it added 1.5GB+ to the image for a redundant PDF path.
RUN apt-get update && apt-get install -y \
    pandoc \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-common \
    fonts-liberation \
    fonts-dejavu \
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