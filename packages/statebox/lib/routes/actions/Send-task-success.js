'use strict'

module.exports = function sendTaskSuccess (statebox, req, res, env) {
  statebox.sendTaskSuccess(
    req.params.executionName,
    env.body.output || {},
    {},
    function (err) {
      if (err) {
        res.status(500)
      } else {
        res.status(200).send()
      }
    }
  )
}
