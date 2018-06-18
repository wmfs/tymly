
function temporaryRiskScore (range, riskScore, mean, stdev) {
  switch (range) {
    case 'veryHigh':
    case 'high':
      return (mean + stdev) / 2

    default:
      return riskScore / 2
  }
} // temporaryRiskScore

module.exports = temporaryRiskScore
