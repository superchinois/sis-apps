FROM node:14.14.0-buster

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json ./
RUN npm install
COPY . ./
ENTRYPOINT ["npm"]
CMD ["run","dev"]
