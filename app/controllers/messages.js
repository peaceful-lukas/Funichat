exports.messageForWorker = function(req, res) {
  req.on('data', function(data) {
    data = JSON.parse(data);
    req.body = data;
    req.body.content = JSON.parse(data.content); 
    res.render('pages/room/message.jade', req.body);
  });
}

exports.message = function(req, res) {
  req.body.content = JSON.parse(req.body.content); 
  res.render('pages/room/message.jade', req.body);
}