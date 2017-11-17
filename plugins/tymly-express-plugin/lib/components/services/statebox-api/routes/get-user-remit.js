const boomUp = require('./boom-up')

module.exports = function getUsersRemit (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const usersService = services.users
  const userId = authService.extractUserIdFromRequest(req)

  usersService.calculateRemitForUser(
    userId,
    function (err, remit) {
      if (err) {
        const boomErr = boomUp(err, 'Error while attempting to calculate user remit')
        res.status(boomErr.output.statusCode).send(boomErr.output.payload)
      } else {
        res.status(200).send(remit)
      }
    }
  )
}
