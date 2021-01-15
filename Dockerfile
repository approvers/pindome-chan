FROM node:14.5.0-alpine3.12
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN pnpm install --frozen-lockfile

ENTRYPOINT [ "pnpm", "start" ]
