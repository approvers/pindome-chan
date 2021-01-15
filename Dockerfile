FROM node:14.5.0-alpine3.12
RUN mkdir /src
COPY . /src
WORKDIR /src
RUN npm install --no-package-lock

ENTRYPOINT [ "npm", "run", "start" ]
