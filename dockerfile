FROM golang:1.17.1-bullseye
WORKDIR /app

COPY ./dist/linux/PS-STATS ./
COPY ./config.yml ./
# COPY ./react/public ./react/public
WORKDIR /app

CMD [ "./PS-STATS" ]