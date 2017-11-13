FROM node:slim
ARG tarfile=bundle.tgz

WORKDIR /usr/src/tymly

COPY $tarfile .

RUN tar zxf bundle.tgz

COPY config/docker.json config/docker.json

ENV NODE_ENV "docker"
CMD ["node", "bundle/packages/tymly-runner/lib/index.js"]
