FROM node:22-alpine

WORKDIR /app

# Copy package files for layer caching
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
