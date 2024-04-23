FROM --platform=linux/amd64 node:21.7.1

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node", "src/index.js" ]