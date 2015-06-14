module.exports = function(){
	var request = require('request');
	var fs = require('fs');

	var initializer = {};

	var configs = JSON.parse(fs.readFileSync('config/project.json'));
	initializer.configs = configs;

	initializer.projectInfo = function(cookie) {

	};

	initializer.initProjectInfo = function(cookie, cb){
		var projectInfoUrl = [configs.apiBase, 'api', 'projects-v', configs.project].join('/');

		request.get({ url: projectInfoUrl, cookie: cookie }, function(error, response, body) {
			cb(body);
		});

	};

	return initializer;
}();
