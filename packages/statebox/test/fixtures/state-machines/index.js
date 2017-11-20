module.exports = {
  formFilling: require('./form-filling.json'),
  helloWorld: require('./hello-world.json'),
  helloThenWorld: require('./hello-then-world.json'),
  helloThenWorldThroughException: require('./hello-world-with-caught-failures.json'),
  helloThenFailure: require('./hello-then-failure.json'),
  helloThenUncaughtFailure: require('./hello-then-uncaught-failure.json'),
  calculator: require('./calculator.json'),
  calculatorWithInputPaths: require('./calculator-with-input-paths.json'),
  pass: require('./pass-state-machine.json'),
  fail: require('./fail-state-machine.json'),
  parallel: require('./parallel-state-machine.json'),
  parallelFail: require('./parallel-fail-state-machine.json')
}
