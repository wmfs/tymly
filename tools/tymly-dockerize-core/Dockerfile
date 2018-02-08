FROM node:8.9.4-slim
#FROM keymetrics/pm2:latest-alpine
ARG tarfile=bundle.tgz

WORKDIR /
CMD ["node", "/tymly/packages/tymly-runner/lib/index.js"]
COPY config/*.json config/

#CMD ["pm2-runtime", "--public", "7bi3gcnm986owgh", "--secret", "xxxxxx", "config/pm2.json"]


ADD $tarfile .
