var supportedFields = {
	"dealFields": ["key","name","order_nr","field_type","options"],
	"deals": ["user_id","person_id","org_id","stage_id","title","value","currency","add_time","update_time","status","lost_reason","visible_to","close_time","pipeline_id","won_time","lost_time","expected_close_date"]
};

var _ = require('lodash');

var filter = {
	dealFields: function(data) {
		return (data.is_custom_flag === true);
	}
}

module.exports = function(kind, data) {
	if (_.keys(supportedFields).indexOf(kind) === -1 && (typeof filter[kind] !== 'function' || filter[kind](data) === true)) {
		return false;
	}

	var reconstitutedData = {};

	_.each(data, function(val, key) {
		// supply all default fields, and custom fields:
		if (supportedFields[kind].indexOf(key) > -1 || key.substr(0,40).match(/^[a-z0-9]{40}$/i)) {
			reconstitutedData[key] = val;
		}
	});

	return reconstitutedData;
}