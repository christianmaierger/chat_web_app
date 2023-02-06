FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm audit fix

# I also could add just the files needed, but two scripts and an .env file should not hurt
COPY . .

# ENV HOST=localhost
ENV PORT=8080

CMD ["npm", "start"]
