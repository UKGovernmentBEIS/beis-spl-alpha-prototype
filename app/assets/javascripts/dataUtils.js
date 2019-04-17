(function (exports) {
  exports.setBirthOrAdoptionInformation = function (data) {
    if (data['birth-or-adoption'] === 'birth') {
      data['primary-leave-type'] = 'maternity'
      data['primary-name'] = 'mother'
      data['secondary-name'] = 'partner'
    } else if (data['birth-or-adoption'] === 'adoption') {
      data['primary-leave-type'] = 'adoption'
      data['primary-name'] = 'primary adopter'
      data['secondary-name'] = 'partner'
    }
  }
})(typeof exports === 'undefined' ? this['utils'] = {} : exports)
