FROM node:14

WORKDIR /app

# I also could add just the files needed, but two scripts and an .env file should not hurt
COPY . .

RUN npm install
RUN npm audit fix

# ENV HOST=localhost
ENV PORT=8080
ENV PORTEXPRESS=3000

CMD ["npm", "start"]
