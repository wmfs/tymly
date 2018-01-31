#/bin/sh

istanbul cover ./node_modules/mocha/bin/_mocha -- -R spec ./plugins/tymly-alerts-plugin/test
bash <(curl -s https://codecov.io/bash) -cF alerts_plugin

