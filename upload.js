var Pipedrive = require('pipedrive'),
	apiToken = process.argv[2],
	sourceFile = process.argv[3],
	_ = require('lodash');

if (!apiToken) {
	console.error('Error: no API token supplied.');
	console.log('Usage: upload.js [apitoken] [file]');
	process.exit(1);
}

if (!sourceFile) {
	console.error('Error: no output file name specified.');
	console.log('Usage: upload.js [apitoken] [file]');
	process.exit(2);
}

var data = require('./' + sourceFile);

var objectConfig = require('./lib/objects.json');

var pipedrive = new Pipedrive.Client(apiToken, true);

_.mixin(require('./lib/mixins.js'));
_.mixin(require('underscore.inflections'));

_.each(objectConfig.objects, function(object) {
	console.log(_.capitalize(object) + ' will be uploaded here.');
})