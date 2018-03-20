FROM keymetrics/pm2:latest-alpine
LABEL maintainer="West Midlands Fire Service <tymly@wmfs.net>"

ARG tarfile=bundle.tgz

WORKDIR /
CMD ["node", "/tymly/packages/tymly-runner/lib/index.js"]
COPY config/*.json config/

ADD $tarfile .
