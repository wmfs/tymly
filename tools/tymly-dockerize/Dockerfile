FROM node:slim
ARG tarfile=bundle.tgz

WORKDIR /usr/src/tymly

COPY $tarfile .

RUN tar zxf bundle.tgz

RUN rm bundle.tgz

COPY config/custom-environment-variables.json config/
COPY config/default.json config/

CMD ["node", "bundle/packages/tymly-runner/lib/index.js"]
