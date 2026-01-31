/**
 * Helper: Check if a sequence name exists in the project
 */
function findUniqueSequenceName(baseName) {
	try {
		var sequences = app.project.sequences;
		var existingNames = {};
		
		// Build a map of existing sequence names
		for (var i = 0; i < sequences.numSequences; i++) {
			existingNames[sequences[i].name] = true;
		}
		
		// If base name doesn't exist, use it
		if (!existingNames[baseName]) {
			return baseName;
		}
		
		// Otherwise, find the next available number
		var counter = 1;
		while (existingNames[baseName + " " + counter]) {
			counter++;
		}
		
		return baseName + " " + counter;
	} catch (e) {
		// If there's an error, just return the base name
		return baseName;
	}
}
