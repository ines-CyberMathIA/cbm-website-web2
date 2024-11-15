FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV WDS_SOCKET_PORT=0

CMD ["npm", "start"] 