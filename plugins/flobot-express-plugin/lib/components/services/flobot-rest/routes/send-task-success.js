const boom = require('boom')

module.exports = function sendTaskSuccess (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const statebox = services.statebox
  const options = JSON.parse(JSON.stringify(req.body))
  const userId = authService.extractUserIdFromRequest(req)

  options.onAuthorizationHook = services.users.onAuthorizationHook.bind(services.users)
  if (userId) {
    options.userId = userId
  }

  options.action = 'sendTaskSuccess'
  console.log('~~~~~~~~~~~')
  res.status(200).send()

  // statebox.updateFlobot(
  //       req.params.flobotId,
  //       options,
  //       function (err, flobot) {
  //         if (err) {
  //           let boomErr
  //           if (err.isBoom) {
  //             boomErr = err
  //           } else {
  //             boomErr = boom.internal('Flobot returned an error while attempting to update', err)
  //           }
  //           res.status(boomErr.output.statusCode).send(boomErr.output.payload)
  //         } else {
  //           res.status(200).send(
  //             {
  //               flobot: flobot
  //             }
  //               )
  //         }
  //       }
  //   )
}
