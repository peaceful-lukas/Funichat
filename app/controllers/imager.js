var async = require('async');
var request = require('request');
var fs = require('fs');
var path = require('path')

var logger = require('../../libs/Logger');


exports.upload = function(req, res) {
  logger.debug('image upload reqest...');
  
  // input(name='image')
  var image = req.files.image;
  
  ucloudStorageUploadImage(image, function(imageUrl) {
    res.json(200, { success: true, imageUrl: imageUrl });
    logger.debug('image file upload success!');
  });
}

function ucloudStorageUploadImage(image, callback) {
  async.waterfall([
    //-------- 이미지 타입 검사
    function(cb) {
      if( image.type.indexOf('image') < 0 ) {
        throw new Error('TYPE ERROR - file type is wrong, not image.');
      }
      else {
        logger.debug('이미지 타입 검사 완료');
        cb(null);
      }
    },
    
    //-------- 사용자 인증 토큰 가져오기.
    function(cb) {
      var uri = 'https://ssproxy.ucloudbiz.olleh.com/auth/v1.0';
      var action = {
        method: 'GET',
        headers: {
          'X-Storage-User': 'ceo@helloworlds.co.kr',
          'X-Storage-Pass': 'MTM3NTk0ODE2NTEzNzU5NDM1MTE3NjU3',
        }
      };
      
      request(uri, action, function(err, res) {
        if(err) throw new Error('U Cloud Biz: X-Auth request failed!');
        
        // 인증 성공.
        else {
          var token = res.headers['x-auth-token'];
          var storageUrl = res.headers['x-storage-url'];
          
          logger.debug('인증 성공');
          cb(null, storageUrl, token);
        }
      });
    },
    
    //--------- 이미지 파일 업로드.
    function(storageUrl, token, cb) {
      var action = {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token,
          'Content-Type': image.type,
          'Content-Length': image.size
        }
      };
      
      var imageName = new Date().getTime() + '.' + image.type.substring(6);
      
      var target = storageUrl + '/funichat/' + imageName;
      fs.createReadStream(image.path).pipe(request(target, action, function(err, res) {
        if(err) throw new Error('U Cloud Biz: file upload failed!');
        
        // 업로드 성공.
        else {
          logger.debug('업로드 성공');
          
          fs.unlink(image.path, function(err) {
            if(err) throw new Error(err.message);
            else {
              logger.debug('서버 이미지 임시 파일 삭제 완료.');
            }
          });
          
          cb(null, imageName);
        }
      }));
    },
    
    //------------ 이미지 CDN 넘겨주고 끝.
    function(imageName, cb) {
      var cdn = 'http://lb01-rx2514.ktics.co.kr/';
      var imageCDN = cdn + imageName;
      
      callback(imageCDN);
    }
  ]);
}


exports.uploadForWorker = function(req, res) {
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });
  
  req.on('end', function() {
    var image = new Buffer(data, 'binary');
    
    ucloudStorageUploadImageForWorker(image, function(imageUrl) {
      res.json(200, { success: true, imageUrl: imageUrl });
      logger.debug('image file upload success!');
    });
    
    
    // createImageFile(data, function(image) {
    //   ucloudStorageUploadImage(image, function(imageUrl) {
    //     res.json(200, { success: true, imageUrl: imageUrl });
    //     logger.debug('image file upload success!');
    //   });
    // });
  })
}

function ucloudStorageUploadImageForWorker(image, callback) {
  async.waterfall([
    //-------- 사용자 인증 토큰 가져오기.
    function(cb) {
      var uri = 'https://ssproxy.ucloudbiz.olleh.com/auth/v1.0';
      var action = {
        method: 'GET',
        headers: {
          'X-Storage-User': 'ceo@helloworlds.co.kr',
          'X-Storage-Pass': 'MTM3NTk0ODE2NTEzNzU5NDM1MTE3NjU3',
        }
      };
      
      request(uri, action, function(err, res) {
        if(err) throw new Error('U Cloud Biz: X-Auth request failed!');
        
        // 인증 성공.
        else {
          var token = res.headers['x-auth-token'];
          var storageUrl = res.headers['x-storage-url'];
          
          logger.debug('인증 성공');
          cb(null, storageUrl, token);
        }
      });
    },
    
    //--------- 이미지 파일 업로드.
    function(storageUrl, token, cb) {
      var action = {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token,
          'Content-Type': 'image/png',
          'Content-Length': image.length
        },
        body: image
      };
      
      var imageName = new Date().getTime() + '.png';
      
      var target = storageUrl + '/funichat/' + imageName;
      request(target, action, function(err, res) {
        if(err) throw new Error('U Cloud Biz: file upload failed!');
        
        // 업로드 성공.
        else {
          logger.debug(res.statusCode);
          logger.debug('업로드 성공');
          cb(null, imageName);
        }
      });
    },
    
    //------------ 이미지 CDN 넘겨주고 끝.
    function(imageName, cb) {
      var cdn = 'http://lb01-rx2514.ktics.co.kr/';
      var imageCDN = cdn + imageName;
      
      callback(imageCDN);
    }
  ]);
}


function createImageFile(imageData, callback) {
  var data = imageData.replace(/^data:image\/png;base64,/, '');
  
  var image = {};
  image.path = path.normalize(__dirname + '/../../public/tmp/image.png');
  
  // canvas 데이터 헤더에 이미지타입, 인코딩 방식 다 있음. 그거 파싱하자. 여기서는 깡무시.
  var buf = new Buffer(data, 'base64');
  fs.writeFile(image.path, buf, function(err) {
    if(err) throw new Error(err.message);
    else {
      image.size = buf.length;
      image.type = 'image/png';
      image.name = 'image.png';
      
      callback(image);
    }
  });
}