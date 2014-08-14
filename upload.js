var Pipedrive = require('pipedrive'),
	apiToken = process.argv[2],
	sourceFile = process.argv[3],
	_ = require('lodash'),
	transform = require('./lib/transform-upload.js');

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
	_.each(_.values(data[object].data), function(item) {
		var itemData = transform(object, item);

		if (itemData !== false) {
			pipedrive[_.capitalize(object)].add(itemData, function(err, createdItem) {
				if (err) throw new Error("Error: " + err.toString() + " " + JSON.stringify(itemData));
				console.log(_.singularize(_.capitalize(object)) + ' ' + createdItem.id + ' created');
			});
		}
	});
})