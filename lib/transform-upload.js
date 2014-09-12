'use strict';

// this library deals with leaving only the necessary fields upon data upload that should be present in
// the uploadable data, per each object type.

var _ = require('lodash');

// whitelist of objects that should get uploaded at all (others will not be uploaded):
var itemsToUpload = ["dealFields", "deals", "users"];

// whitelist of fields, per each object type, that should be part of the object data upon upload:
var fieldsToUpload = {
	"dealFields": ["name","field_type","options","add_visible_flag"],
	"deals": ["user_id","person_id","org_id","stage_id","title","value","currency","add_time","update_time","status","lost_reason","visible_to","close_time","pipeline_id","won_time","lost_time","expected_close_date"],
	"users": ["name","email","active_flag"]
};

// custom filtering methods per object type (called only when one exists):
var filter = {
	dealFields: function(data) {
		return data.edit_flag;
	}
};

// custom transform methods per object type (called only when one exists):
var transform = {
	dealFields: function(data) {
		if (data.field_type === 'person') data.field_type = 'people';
		if (data.options) {
			var opts = [];
			_.each(data.options, function(val, key) {
				opts.push(val.label);
			});
			data.options = JSON.stringify(opts);
		}
		return data;
	}
}

// the transformer method that takes in the data prepared for upload, and transforms it to acceptable format for the API:
//     @param kind - object type; string
//     @param data - item data; object
module.exports = function(kind, data) {
	if (_.keys(fieldsToUpload).indexOf(kind) === -1 || (typeof filter[kind] === 'function' && !filter[kind](data))) {
		return false;
	}

	var reconstitutedData = {};

	_.each(data, function(val, key) {
		// supply all default fields, and custom fields (@TODO: handle custom field key matching, old vs new):
		if (fieldsToUpload[kind].indexOf(key) > -1 || key.substr(0,40).match(/^[a-z0-9]{40}$/i)) {
			reconstitutedData[key] = val;
		}
	});

	return (typeof transform[kind] == 'function' ? transform[kind](reconstitutedData) : reconstitutedData);
}

