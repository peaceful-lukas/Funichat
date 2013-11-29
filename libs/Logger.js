var log4js = require('log4js'); 

log4js.configure({
	appenders: [
		{ type: 'console' },
		{ type: 'file', filename: 'logs/funichat.log', category: 'funichat' }
	]
});

var logger = log4js.getLogger('funichat');

logger.setLevel('DEBUG');
module.exports = logger;
// module.exports = log4js.getLogger('funichat');