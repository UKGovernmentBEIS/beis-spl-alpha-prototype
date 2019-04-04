const helpers = $('.markdown-helper')
const converter = new showdown.Converter()
helpers.each(function () {
  const $helper = $(this)
  const $markdown = $helper.find('.markdown')
  const $preview = $helper.find('.preview')
  $markdown.find('button').on('click', function () {
    const html = converter.makeHtml($markdown.find('textarea').val())
    $helper.find('.html').html(html)
    $markdown.hide()
    $preview.show()
  })
})

const ESC = 27
$(window).on('keydown', function (e) {
  if (e.keyCode === ESC) {
    $('.preview').hide()
    $('.markdown').show()
  }
})
