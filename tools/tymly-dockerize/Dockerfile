FROM node:slim
ARG tarfile=bundle.tgz

WORKDIR /usr/src/tymly

COPY $tarfile .

RUN tar zxf bundle.tgz

COPY config/* config/

CMD ["node", "bundle/packages/tymly-runner/lib/index.js"]
