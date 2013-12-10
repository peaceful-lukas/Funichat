var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var logger  = require('../../libs/Logger');

/**
 * Favorite Schema
 */
var FavoriteSchema = new Schema({
  rid: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  uid: { type: String, required: true }
});

/**
 * Index
 */
FavoriteSchema.index({ rid: 1, uid: 1 }, { unique: true });

/**
 * Methods
 */
FavoriteSchema.methods = {
  // 즐겨찾기 설정.
  hold: function(callback) {
    this.save(function(err) {
      if(err) throw new Error(err.message);
      else {
        callback();
      }
    });
  },
}

/**
 * Statics
 */
FavoriteSchema.statics = {
  // 유저의 모든 즐겨찾기 리스트 리턴.
  list: function(uid, callback) {
    this.find({ uid: uid }, function(err, favs) {
      if(err) throw new Error(err.message);
      else {
        favs = favs ? favs : [];
        callback(favs);
      }
    })
  },
  
  // 즐겨찾기가 되어있는지 아닌지 확인 후 불리언 값으로 리턴.
  check: function(rid, uid, callback) {
    this.findOne({ uid: uid, rid: rid }, function(err, fav) {
      if(err) throw new Error(err.message);
      else {
        if(fav) callback(true);
        else    callback(false);
      }
    });
  },
  
  // 즐겨찾기 해제.
  unhold: function(rid, uid, callback) {
    this.remove({ uid: uid, rid: rid}, function(err) {
      if(err) throw new Error(err.message);
      else {
        callback();
      }
    })
  }
};



mongoose.model('Favorite', FavoriteSchema);