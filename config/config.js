var rootPath = require('path').normalize(__dirname + '/..');

module.exports = {
	
	development: {
		
		db: {
			host: 'mongodb://101.55.14.36/funichat-dev',
			option: {
				server: { poolSize: 5 }
			}
		},

		rabbitMQ: {
		    host: 'www.hellowd.com',
			port: 5672,
			login: "hellowd",
			password: "world!@#"
		},

		root: rootPath,
		app: {
			name: 'FuniChat for Dev'
		}
	},

	production: {
        db: {
            host: 'mongodb://10.128.1.24/funichat',
            option: {
                server: { poolSize: 16 }
            }
        },
        rabbitMQ: {
            host: '10.128.1.23',
            port: 5672,
            login: "hellowd",
			password: "world!@#"
        },
        root: rootPath,
        app: {
            name: 'FuniChat for Production'
        }
    }
}