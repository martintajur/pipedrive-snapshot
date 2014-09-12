'use strict';

// this scripts uploads the contents of the JSON datafile to a new Pipedrive account

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

var data = require('./' + sourceFile),
	idMapper = require('./lib/id-mapper.js')(data),
	objectConfig = require('./lib/objects.json'),
	pipedrive = new Pipedrive.Client(apiToken, true);

_.mixin(require('./lib/mixins.js'));
_.mixin(require('underscore.inflections'));

// iterate through all kinds of objects in the JSON datafile
_.each(objectConfig.objects, function(object) {

	// then iterate through all items of one kind
	_.each(_.values(data[object].data), function(item) {

		// store the old item data with the id-mapper
		idMapper.setNewId(object, item, false);

		// transform the item to be save'able to the API under new account
		var transformedItem = transform(object, idMapper.map(object, item));

		// continue only if the item was successfully transformed
		if (transformedItem !== false) {

			// save the item to the new account via API
			pipedrive[_.capitalize(object)].add(transformedItem, function(err, createdItem) {

				// and then store the new ID with the old ID
				idMapper.setNewId(object, item, createdItem);

				if (err) throw new Error("Error: " + err.toString() + " " + JSON.stringify(transformedItem));
				console.log(_.singularize(_.capitalize(object)) + ' ' + createdItem.id + ' created');
			});
		}
		else {
			console.log('Ingoring ' + _.singularize(object) + ' (' + JSON.stringify(item.id) + ')');
		}
	});
});
