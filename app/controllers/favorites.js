var mongoose = require('mongoose');
var Favorite = mongoose.model('Favorite');

var logger   = require('../../libs/Logger');

exports.addFavorite = function(req, res) {
  var favorite = new Favorite({
    rid: req.body.rid,
    uid: req.session.name
  });
  
  favorite.hold(function() {
    res.json(200, { success: true });
  });
}

exports.removeFavorite = function(req, res) {
  var rid = req.body.rid;
  var uid = req.session.name;
  
  Favorite.unhold(rid, uid, function() {
    res.json(200, { success: true });
  });
}