FROM golang:1.19.0-bullseye
WORKDIR /app

COPY ./dist/linux/PS-STATS ./
COPY ./config.yml ./
WORKDIR /app

CMD [ "./PS-STATS" ]