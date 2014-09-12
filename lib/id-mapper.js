'use strict';

// this library deals solely with handling of IDs of items upon uploading — 
// extracting old IDs from the data in the datafile, and storing them in a
// temporary bucket (idMap) in order to match them to new IDs created on
// the new account, providing this data for references within data, such as
// when linking a deal with a person, for example.

var _ = require('lodash');

// the idMap consists of old and new IDs, in the following format:
// idMap[object][oldId] = newId, e.g. idMap.deals[123] = 312, ...
var idMap = {};

// custom ID mapper methods per each object type. These methods will be called
// with old item data, and it should return the same data with new IDs in place.
// (called only when one exists):
var mappers = {
	deal: function(item) {
		return item;
	}
};

// per object type ID collection methods, handling the internal IDs within each object.
// (for all field-objects — dealFields, personFields, etc) the custom field option IDs
// must be collected here (called only when one exists):
var oldIdCollectors = {
	dealField: function(oldData, newData) {
		idMap.customFieldOptions = idMap.customFieldOptions || {};
		if (old.options) {
			_.each(oldData.options, function(oldOpt) {
				_.each(newData.options, function(newOpt) {
					if (oldOpt.label === newOpt.label) {
						idMap.customFieldOptions[oldOpt.id] = newOpt.id;
					}
				});
			});
		}
	}
}

// method that returns the new ID of an item, given the object kind and old ID
// @param object - type of object; string
// @param oldId - old ID of the item; int
function getNewId(object, oldId) {
	if (typeof idMap[object][oldId] === 'undefined') return false;
	return idMap[object][oldId];
}

// method that returns the old ID of an item, given the object kind and new ID
// @param object - type of object; string
// @param newId - new ID of the item; int
function getOldId(object, newId) {
	var returnVal = false;
	_.each(idMap[object], function(newIdInMap, oldId) {
		if (newId === newIdInMap) {
			returnVal = oldId;
		}
	});
	return returnVal;
}

// this module exports a function which is invoked by passing in the raw original data
// initially, and it returns back multiple methods:
// map(object, item)
//     @param object - type of object; string
//     @param item - item data; object
// setNewId(object, oldData, newData)
//     @param object - type of object; string
//     @param oldData - old item data; object
//     @param newData - new item data; object|boolean
module.exports = function(data) {
	rawData = data;

	return {
		map: function(object, item) {
			if (typeof mappers[object] !== 'function') {
				return item;
			}

			return mappers[object](item);
		},
		setNewId: function(object, oldData, newData) {
			idMap[object] = idMap[object] || {};
			idMap[object][oldData.id] = newData && newData.id || false;
			if (typeof oldIdCollectors[object] == 'function') {
				oldIdCollectors[object](oldData, newData);
			}
			return true;
		}
	};
}
