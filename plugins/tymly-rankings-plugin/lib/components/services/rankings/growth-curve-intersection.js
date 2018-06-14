
function growthCurveIntersection (riskScore, tempScore, exp) {
  const scoreRatio = riskScore / tempScore
  const adjustedRatio = (scoreRatio - 1) / 81

  const logRatio = Math.log(adjustedRatio)

  const days = logRatio / exp

  return Math.floor(days)
} // growthCurveIntersection

module.exports = growthCurveIntersection