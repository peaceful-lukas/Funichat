exports.message = function(req, res) {
	res.render('pages/room/message.jade', req.body);
}