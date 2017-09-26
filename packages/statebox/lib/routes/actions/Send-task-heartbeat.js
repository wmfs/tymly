'use strict'
module.exports = function sendTaskHeartbeat (statebox, req, res, env) {
  statebox.sendTaskHeartbeat(
    req.params.executionName,
    env.body.output || {},
    {},
    function (err, executionDescription) {
      if (err) {
        res.status(500)
      } else {
        res.status(200).send(executionDescription)
      }
    }
  )
}

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
