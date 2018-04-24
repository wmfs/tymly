'use strict'

const moment = require('moment')

module.exports = function generateTimeSlots (diary, inputDate) {
  const slots = []

  const date = moment(inputDate).format('YYYY-MM-DD')
  let startTime = moment(date + 'T' + diary.startTime)
  let endTime = moment(date + 'T' + diary.endTime)

  while (startTime.isBefore(endTime)) {
    slots.push([startTime.format('HH:mm:ss'), 0])
    startTime.add(diary.duration, 'm')
  }

  return slots
}
