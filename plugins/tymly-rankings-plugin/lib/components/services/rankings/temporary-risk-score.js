
function temporaryRiskScore (range, riskScore, mean, stddev) {
  switch (range) {
    case 'veryHigh':
    case 'high':
      return mean + (stddev / 2)

    default:
      return riskScore
  }
} // temporaryRiskScore

module.exports = temporaryRiskScore
