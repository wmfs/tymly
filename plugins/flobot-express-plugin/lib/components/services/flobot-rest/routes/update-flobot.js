module.exports = function updateFlobotRoute (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots

  const options = JSON.parse(JSON.stringify(req.body))
  const userId = authService.extractUserIdFromRequest(req)

  options.onAuthorizationHook = flobotServices.users.onAuthorizationHook.bind(flobotServices.users)
  if (userId) {
    options.userId = userId
  }

  options.action = 'updateFlobot'

  flobotsService.updateFlobot(
        req.params.flobotId,
        options,
        function (err, flobot) {
          if (err) {
            console.error(JSON.stringify(err, null, 2))
            let status
            if (err.name === 'flobotPersistenceGetFail') {
              status = 404
              err = {
                name: 'noFlobot',
                message: err.message
              }
            } else {
              status = err.status || 500
            }
            res.status(status).send(
              {
                error: err
              }
                )
          } else {
            res.status(200).send(
              {
                flobot: flobot
              }
                )
          }
        }
    )
}
