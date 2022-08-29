FROM node:16.17.0-alpine
WORKDIR /usr/src/app
VOLUME /usr/src/files
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]