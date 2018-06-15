const toTwoDp = require('./to-two-dp')

function smallPopulationRanges (scores, mean, stdev) {
  return {
    veryLow: {
      lowerBound: 0,
      upperBound: toTwoDp(mean - stdev)
    },
    medium: {
      lowerBound: toTwoDp(mean - stdev + 0.01),
      upperBound: toTwoDp(mean + stdev)
    },
    veryHigh: {
      lowerBound: (mean + stdev + 0.01),
      upperBound: Math.max(...scores)
    }
  }
} // smallPopulationRanges

function largePopulationRanges (scores, mean, stdev) {
  const twoStdev = 2 * stdev

  return {
    veryLow: {
      lowerBound: 0,
      upperBound: toTwoDp(mean - twoStdev)
    },
    low: {
      lowerBound: toTwoDp(mean - twoStdev + 0.01),
      upperBound: toTwoDp(mean - stdev)
    },
    medium: {
      lowerBound: toTwoDp(mean - stdev + 0.01),
      upperBound: toTwoDp(mean + stdev)
    },
    high: {
      lowerBound: toTwoDp(mean + stdev + 0.01),
      upperBound: toTwoDp(mean + twoStdev)
    },
    veryHigh: {
      lowerBound: toTwoDp(mean + twoStdev + 0.01),
      upperBound: Math.max(...scores)
    }
  }
} // largePopulationRanges

function generateRanges (scores, mean, stdev) {
  const range = (scores.length > 10000)
    ? largePopulationRanges(scores, mean, stdev)
    : smallPopulationRanges(scores, mean, stdev)

  range.find = score => findRange(range, score)

  return range
} // generateRanges

function findRange (ranges, score) {
  for (const [name, range] of Object.entries(ranges)) {
    if (score >= range.lowerBound && score <= range.upperBound) {
      return name
    }
  }
}

module.exports = generateRanges
