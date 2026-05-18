FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY index.js .
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 socketuser
USER socketuser
EXPOSE 3001
CMD ["node", "index.js"]
