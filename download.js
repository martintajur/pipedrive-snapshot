var Pipedrive = require('pipedrive'),
	apiToken = process.argv[2],
	targetFile = process.argv[3],
	_ = require('lodash'),
	objectConfig = require('./lib/objects.json');

if (!apiToken) {
	console.error('Error: no API token supplied. Usage: download.js [apitoken] [file]');
	process.exit(1);
}

if (!targetFile) {
	console.error('Error: no output file name specified. Usage: download.js [apitoken] [file]');
	process.exit(2);
}

var pipedrive = new Pipedrive.Client(apiToken, true);

_.mixin(require('./lib/mixins.js'));
_.mixin(require('underscore.inflections'));

var downloadedData = { _meta: { start_time: new Date().toISOString() } },
	completedItems = {};

var writeFile = function() {
	var fs = require('fs');
	downloadedData._meta.end_time = new Date().toISOString();
	fs.writeFileSync(targetFile, JSON.stringify(downloadedData, null, 2));
	console.log('Success! '+targetFile+' written');
	process.exit(0);
}

process.on('SIGINT', writeFile);
process.on('SIGTERM', writeFile);
process.on('SIGHUP', writeFile);

// fetch all object of each object type
_.each(objectConfig.objects, function(object) {
	var start = 0,
		pageSize = 250,
		perObjectTypeLimit = -1;

	downloadedData[object] = { total: 0, data: {} };

	var fetchPage = function() {
		var nextPage = function(data, additionalData) {
			// more items to download:
			if (additionalData && additionalData.pagination && additionalData.pagination.next_start && additionalData.pagination.more_items_in_collection === true && (perObjectTypeLimit == -1 || downloadedData[object].total < perObjectTypeLimit)) {
				console.log('Downloading ' + object + ' ... ('+downloadedData[object].total+' downloaded)');
				start = additionalData.pagination.next_start;
				fetchPage();
				return;
			}

			// all items of this kind are downloaded:
			completedItems[object] = true;
			console.log('All ' + object + ' downloaded. '+downloadedData[object].total+' in total.');

			// all items of all kinds are downloaded:
			if (_.keys(completedItems).length === objectConfig.objects.length) {
				writeFile();
			}
		}

		console.log('Fetching ' + object + ' from ' + start + ' to ' + (start+pageSize));
		pipedrive[_.capitalize(object)].getAll({ start: start, limit: pageSize }, function(err, data, additionalData) {
			if (err) throw err;

			var subitemsToFetch = 0,
				subitemsFetched = 0,
				detailedItemsToFetch = 0,
				detailedItemsFetched = 0,
				nextPageCalled = false;

			var checkNext = function(data, additionalData) {
				if (!nextPageCalled && subitemsFetched === subitemsToFetch && detailedItemsToFetch == detailedItemsFetched) {
					nextPageCalled = true;
					nextPage(data, additionalData);
				}
			};

			_.each(data, function(item) {
				downloadedData[object].data[item.id] = item.toObject();
				downloadedData[object].total++;

				// check if for any object of this kind, additional sub-objects should be fetched:
				if (typeof objectConfig.subObjects[object] !== 'undefined') {
					downloadedData[object].subitems = downloadedData[object].subitems || {};

					_.each(objectConfig.subObjects[object], function(subobject) {
						subitemsToFetch++;
						downloadedData[object].subitems[item.id] = downloadedData[object].subitems[item.id] || {};
						item['get' + _.capitalize(subobject)](function(subErr, subData, subAdditionalData) {
							if (subErr) throw subErr;
							if (!_.isEmpty(subData)) {
								downloadedData[object].subitems[item.id][subobject] = subData;
							}
							subitemsFetched++;
							console.log('All ' + subobject + ' of ' + _.singularize(object) + ' ' + item.id + ' downloaded. '+subData.length+' in total.');

							checkNext(data, additionalData);
						});
					});
				}

				// check if for any object of this kind, detailed data must be fetched via GET /v1/[objectType]/[id]
				if (objectConfig.detailedObjects.indexOf(object) > -1) {
					detailedItemsToFetch++;
					pipedrive[_.capitalize(object)].get(item.id, function(detailedErr, detailedItem) {
						if (detailedErr) throw detailedErr;
						if (!_.isEmpty(detailedItem)) {
							downloadedData[object].data[item.id] = detailedItem.toObject();
						}
						detailedItemsFetched++;
						console.log('Detailed ' + _.singularize(object) + ' ' + item.id + ' downloaded.');

						checkNext(data, additionalData);
					});
				}
			});

			if (typeof objectConfig.subObjects[object] === 'undefined' && objectConfig.detailedObjects.indexOf(object) === -1) {
				nextPage(data, additionalData);
			}
		});
	}

	fetchPage();
});