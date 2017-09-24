
module.exports = function getUsersRemit (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const usersService = services.users
  const boom = require('boom')
  const userId = authService.extractUserIdFromRequest(req)

  usersService.calculateRemitForUser(
    userId,
    function (err, remit) {
      if (err) {
        let boomErr
        if (err.isBoom) {
          boomErr = err
        } else {
          boomErr = boom.internal('Error while attempting to calculate user remit', err)
        }
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(200).send(remit)
      }
    }
  )
}
