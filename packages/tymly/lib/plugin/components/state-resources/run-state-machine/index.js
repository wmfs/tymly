const COMPLETE = 'COMPLETE'
const FAILED = 'FAILED'

class RunStateMachine {
  init (stateConfig, options, callback) {
    this.statebox = options.bootedServices.statebox
    this.stateMachine = stateConfig.stateMachine

    callback(null)
  } // init

  async run (event, context, done) {
    const exists = this.statebox.findStateMachineByName(this.stateMachine)
    if (!exists) {
      return context.sendTaskFailure({
        error: 'runStateMachine',
        cause: new Error(`Reference state machine ${this.stateMachine}`)
      })
    }

    const responseName = desiredResponse(context)
    const execDesc = await this.statebox.startExecution(
      event,
      this.stateMachine,
      {
        sendResponse: responseName,
        userId: context.userId
      }
    )

    if (COMPLETE === responseName) {
      if (FAILED !== execDesc.status) { return context.sendTaskSuccess(execDesc.ctx) }

      context.sendTaskFailure({
        error: execDesc.errorCode,
        cause: execDesc.errorMessage
      })
    } else {
      context.sendTaskHeartbeat(execDesc.ctx, (err, executionDescription) => {
        if (err) throw new Error(err)
        executionDescription.currentResource = execDesc.currentResource
        done(executionDescription)
      })
    }
  } // run
} // class RunStateMachine

function desiredResponse (context) {
  const callback = context.task.callbackManager.callbacks[context.executionName]
  return callback ? callback.eventName : COMPLETE
} // desiredResponse

module.exports = RunStateMachine
