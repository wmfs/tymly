
module.exports = function getUsersRemit (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const usersService = flobotServices.users

  const userId = authService.extractUserIdFromRequest(req)

  usersService.calculateRemitForUser(
    userId,
    function (err, remit) {
      if (err) {
        res.status(500).send(err)
      } else {
        res.status(200).send(remit)
      }
    }
  )
}
