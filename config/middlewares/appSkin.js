var mongoose = require('mongoose');
var Game = mongoose.model('Game');

var parser = require('../../libs/parser');

module.exports = {
  apply: function(req, res, next) {
    if( !req.session.css ) {
      var gid = req.session.gid;
      Game.findOne({ gid: gid }, function(err, game) {
        if(err) throw new Error(err.message);
        else {
          if(game) {
            req.session.css = game.themeSource.css;
            req.session.cssDef = parser.parse(game.themeSource.definition);
            
            next();
          }
          else {
            throw new Error('[appSkin.js] No matched game object - wrong gid');
          }
        }
      });
    }
    else {
      next();
    }
  }
}