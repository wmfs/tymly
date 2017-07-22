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
            res.status(err.output.statusCode).send(err.output.payload)
          } else {
            res.status(204).send()
          }
        }
    )
}
