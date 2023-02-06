FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm audit fix

COPY . .

# ENV HOST=localhost
ENV PORT=8080

CMD ["npm", "start"]
