FROM node:slim
ARG tarfile=bundle.tgz

WORKDIR /
CMD ["node", "/tymly/packages/tymly-runner/lib/index.js"]

COPY config/*.json config/

ADD $tarfile .
