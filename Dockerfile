FROM node:10

WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install

COPY . /usr/src/app/

EXPOSE 8080

CMD ["npm", "start"]
