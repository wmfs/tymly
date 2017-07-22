module.exports = function getFlobotRoute (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots

  flobotsService.getFlobot(
        req.params.flobotId,
    {
      userId: authService.extractUserIdFromRequest(req),
      onAuthorizationHook: flobotServices.users.onAuthorizationHook.bind(flobotServices.users),
      action: 'getFlobot'
    },
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
