FROM golang:1.17.1-bullseye
WORKDIR /app

COPY ./dist/linux/PS-STATS ./
COPY ./config.yml ./
WORKDIR /app

CMD [ "./PS-STATS" ]