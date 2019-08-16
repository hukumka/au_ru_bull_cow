FROM node:10

WORKDIR /usr/src/app

COPY package.json package-lock.json tsconfig.json /usr/src/app/
RUN npm install

COPY ./src /usr/src/app/src

EXPOSE 8080

CMD ["npm", "start"]
