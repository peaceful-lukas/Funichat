var crypto = require('crypto');
var async = require('async');
var querystring = require('querystring');

var logger = require('../../libs/Logger');

module.exports = {
  execute: function(req, res, next) {
    
    async.waterfall([
      // 프리패스
      function(cb) {
        if( req.query.bypass && req.query.bypass === 'helloworld' ) {
          req.query.gid = 'helloworld';
          req.query.name = 'hellowd-user-' + Math.floor( 1 + Math.random() * 1000);
          next();
        }
        else {
          cb(null);
        }
      },
      
      // 이미 한번 검증된 경우
      function(cb) {
        if( req.session.gid && req.session.name ) {
          next();
        }
        else {
          cb(null);
        }
      },
      
      // 파라미터 검증
      function(cb) {
        if( req.query.basis && req.query.timestamp && req.query.hash ) {
          cb(null);
        }
        else {
          res.status(412).render('status/412.jade');
        }
      },
      
      // hash 검증
      function(cb) {
        var hash = req.query.hash;
        var key = 'basis=' + encodeURIComponent(req.query.basis) + '&timestamp=' + encodeURIComponent(req.query.timestamp);
        
        var result = crypto.createHash('sha256').update(key).digest('base64');
        if(result === hash) {
          cb(null);
        }
        else {
          res.status(403).render('status/403.jade');
        }
      },
      
      
      // 타임스탬프 검증
      function(cb) {
        var now = new Date().getTime();
        var timestamp = new Date(req.query.timestamp).getTime();
        
        // 현재시각으로부터 30초이내의 요청만 받아들인다.
        if( now - timestamp > -30 * 1000 && now - timestamp < 30 * 1000 ) {
          cb(null);
        }
        else {
          res.status(408).render('status/408.jade');
        }
      },
      
      
      // basis 복호화
      function(cb) {
        logger.debug('basis original');
        logger.debug(encodeURIComponent(req.query.basis));
        
        var basis = req.query.basis;
        
        var iv = new Buffer('FuniChat@HelloWd', 'utf-8');
        var key = new Buffer(32);
        key.fill(0);
        
        var basisBase64 = new Buffer(basis, 'base64');
        
        try {
          var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
          var decrypted = decipher.update(basisBase64, 'base64', 'utf8');
          decrypted += decipher.final('utf8');
          
          logger.debug('basis deciphered');
          logger.debug(decrypted);
          
          var params = querystring.parse(decrypted);
          var gid = params.gid;
          var name = params.name;
          var profileImageUrl = params.profileImageUrl;
          
          cb(null, gid, name, profileImageUrl);
          
        } catch(e) {
          logger.debug(e);
          res.status(400).render('status/400.jade');
        }
      },
      
      // gid 검증
      function(gid, name, profileImageUrl) {
        if( gid === null || name === null) {
          res.status(400).render('status/400.jade');
        }
        else {
          req.query.gid = gid;
          req.query.name = name;
          req.query.profileImageUrl = profileImageUrl;
          next();
        }
      }
    ]);
  }
}