var APP = {};

APP.resize = function() {
  // Lobby
  $('input.nav-search').css('width', $(window).width() - 220);
  
  // Form
  $('#form .room-info-cell > input.input-box').css('width', $(window).width() - 200);
  
  // Room > Chat
  $('input.message-input-box').css('width', $(window).width() - 150);
  
  // Room > Info
  $('#info .room-info-cell > input.input-box').css('width', $(window).width() - 130);
}

$(window).on('resize', APP.resize);