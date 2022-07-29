FROM golang:1.17.1-bullseye
WORKDIR /app

COPY ./main ./
COPY ./config.yml ./
COPY ./react/public ./react/public
WORKDIR /app

CMD [ "./main" ]