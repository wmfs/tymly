const respond = require('./respond')

module.exports = function getUsersRemit (req, res) {
  const services = req.app.get('services')
  const authService = services.auth
  const usersService = services.users
  const userId = authService.extractUserIdFromRequest(req)

  usersService.calculateRemitForUser(
    userId,
    function (err, remit) {
      respond(res, err, remit, 200, 'Error while attempting to calculate user remit')
    }
  )
}
