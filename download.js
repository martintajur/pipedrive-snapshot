var Pipedrive = require('../client-nodejs/index.js'),
	apiToken = process.argv[2],
	targetFile = process.argv[3],
	_ = require('lodash');

if (!apiToken) {
	console.error('Error: no API token supplied.');
	console.log('Usage: download.js [apitoken] [file]');
	process.exit(1);
}

if (!targetFile) {
	console.error('Error: no output file name specified.');
	console.log('Usage: download.js [apitoken] [file]');
	process.exit(2);
}

var pipedrive = new Pipedrive.Client(apiToken, true),
	objects = ['deals','persons','organizations','notes','activities','products','dealFields','personFields','productFields','organizationFields','pipelines','stages','users','activityTypes','currencies','emailThreads','filters','permissionSets','goals','pushNotifications','roles','companySettings','companyFeatures'],
	subObjects = {
		deals: ['products','followers']
	},
	detailedObjects = ['filters'];

_.mixin(require('./lib/mixins.js'));
_.mixin(require('underscore.inflections'));

var downloadedData = {},
	completedItems = {};

_.each(objects, function(object) {
	var start = 0,
		perObjectTypeLimit = 500;

	downloadedData[object] = { total: 0, data: [] };

	var fetchPage = function() {
		var nextPage = function(data, additionalData) {
			// more items to download:
			if (additionalData && additionalData.pagination && additionalData.pagination.more_items_in_collection === true && downloadedData[object].total < perObjectTypeLimit) {
				console.log('Downloading ' + object + ' ... ('+downloadedData[object].total+' downloaded)');
				start = additionalData.next_start;
				fetchPage();
				return;
			}

			// all items of this kind are downloaded:
			completedItems[object] = true;
			console.log('All ' + object + ' downloaded. '+downloadedData[object].total+' in total.');

			// all items of all kinds are downloaded:
			if (_.keys(completedItems).length === objects.length) {
				var fs = require('fs');
				fs.writeFileSync(targetFile, JSON.stringify(downloadedData, null, 2));
				console.log('Success! '+targetFile+' written');
				process.exit(0);
			}
		}

		pipedrive[_.capitalize(object)].getAll({ start: start, limit: 250 }, function(err, data, additionalData) {
			var subitemsToFetch = 0,
				subitemsFetched = 0;

			_.each(data, function(item) {
				downloadedData[object].data.push(item.toObject());
				downloadedData[object].total++;

				if (typeof subObjects[object] !== 'undefined') {
					downloadedData[object].subitems = downloadedData[object].subitems || {};

					_.each(subObjects[object], function(subobject) {
						subitemsToFetch++;
						downloadedData[object].subitems[subobject] = downloadedData[object].subitems[subobject] || {};
						item['get' + _.capitalize(subobject)](function(subErr, subData, subAdditionalData) {
							downloadedData[object].subitems[subobject][item.id] = subData;
							subitemsFetched++;
							console.log('All ' + subobject + ' of ' + _.singularize(object) + ' ' + item.id + ' downloaded. '+subData.length+' in total.');

							if (subitemsFetched === subitemsToFetch) {
								nextPage(data, additionalData);
							}
						});
					});
				}
			});

			if (typeof subObjects[object] === 'undefined') {
				nextPage(data, additionalData);
			}
		});
	}

	fetchPage();
})