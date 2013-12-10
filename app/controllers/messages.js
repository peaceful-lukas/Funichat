exports.message = function(req, res) {
  req.body.content = JSON.parse(req.body.content); 
  
	res.render('pages/room/message.jade', req.body);
}