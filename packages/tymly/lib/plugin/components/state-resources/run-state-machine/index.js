
class RunStateMachine {
  init (stateConfig, options, callback) {
    this.statebox = options.bootedServices.statebox
    this.stateMachine = stateConfig.stateMachine

    callback(null)
  }

  async run (event, context) {
    const execDesc = await this.statebox.startExecution(
      event,
      this.stateMachine,
      {
        sendResponse: 'COMPLETE'
      }
    )

    context.sendTaskSuccess(execDesc.ctx)
  }
}

module.exports = RunStateMachine
