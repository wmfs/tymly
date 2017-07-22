module.exports = function cancelFlobotRoute (req, res) {
  const flobotServices = req.app.get('flobotServices')
  const authService = flobotServices.auth
  const flobotsService = flobotServices.flobots

  flobotsService.cancelFlobot(
        req.params.flobotId,
    {
      userId: authService.extractUserIdFromRequest(req),
      onAuthorizationHook: flobotServices.users.onAuthorizationHook.bind(flobotServices.users),
      action: 'cancelFlobot'
    },
        function (err) {
          if (err) {
            console.error(JSON.stringify(err, null, 2))
            res.status(err.status || 500).send(
              {
                error: err
              }
                )
          } else {
            res.status(204).send()
          }
        }
    )
}
