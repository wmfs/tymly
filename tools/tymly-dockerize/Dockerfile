FROM node:slim
ARG tarfile=bundle.tgz

WORKDIR /usr/src/tymly
CMD ["node", "bundle/packages/tymly-runner/lib/index.js"]

COPY config/*.json config/

ADD $tarfile .

