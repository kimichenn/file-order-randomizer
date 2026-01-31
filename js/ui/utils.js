// UTILITY FUNCTIONS

function escapeJSONString(str) {
	return str.replace(/\\/g, "\\\\")
	          .replace(/"/g, '\\"')
	          .replace(/'/g, "\\'");
}
