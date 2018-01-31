'use strict'

module.exports = function sendTaskSuccess (statebox, req, res, env) {
  statebox.sendTaskSuccess(
    req.params.executionName,
    env.body.output || {},
    {},
    function (err) {
      if (err) {
        console.error(err)
        res.status(500).send()
      } else {
        res.status(200).send()
      }
    }
  )
}
