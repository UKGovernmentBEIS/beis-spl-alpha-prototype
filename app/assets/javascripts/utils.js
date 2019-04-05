(function (exports) {
  const base64Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'

  exports.encodeWeeks = function (weeks) {
    let encodedDates = ''
    let currentCharCode = ''
    weeks.forEach(function (week) {
      if (currentCharCode.length === 6) {
        encodedDates += base64Chars[parseInt(currentCharCode, 2)]
        currentCharCode = ''
      }
      currentCharCode += week.mother ? '1' : '0'
      currentCharCode += week.partner ? '1' : '0'
    })
    while (currentCharCode.length < 6) {
      currentCharCode += '0'
    }
    encodedDates += base64Chars[parseInt(currentCharCode, 2)]
    return encodedDates
  }

  exports.decodeWeeks = function (encodedWeeks, firstWeek, moment) {
    const weeks = {}
    for (let i = 0; i < encodedWeeks.length; i++) {
      const char = encodedWeeks[i]
      const code = base64Chars.indexOf(char)
      if (code === -1) {
        return {}
      }
      let binary = code.toString(2)
      while (binary.length < 6) {
        binary = '0' + binary
      }
      for (let j = 0; j < 6; j++) {
        const weekOffset = (i * 3) + Math.floor(j / 2)
        const week = moment(firstWeek).add(weekOffset, 'weeks').format('YYYY-MM-DD')
        const parent = j % 2 === 0 ? 'mother' : 'partner'
        const isLeave = parseInt(binary[j]) === 1
        weeks[parent + '-' + week] = isLeave
      }
    }
    return weeks
  }

})(typeof exports === 'undefined' ? this['utils'] = {} : exports)
