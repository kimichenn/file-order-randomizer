/**
 * Execute randomization (main entry point from UI)
 */
function executeRandomization(configJSON) {
	try {
		var config = JSON.parse(configJSON);
		
		// Get source item based on mode
		if (config.mode === "bin" || config.mode === "manual") {
			var selection = app.getCurrentProjectViewSelection();
			
			if (config.mode === "bin") {
				// Check for explicit selection first
				if (selection && selection.length > 0 && selection[0].type === 2) {
					config.sourceItem = selection[0];
				} else {
					// Fallback to active bin
					var activeBin = app.project.getInsertionBin();
					if (activeBin && activeBin.type === 2) {
						config.sourceItem = activeBin;
					} else {
						return JSON.stringify({ 
							success: false, 
							message: "No bin selected or active" 
						});
					}
				}
			} else {
				// Manual mode requires explicit selection
				if (selection.length === 0) {
					return JSON.stringify({ 
						success: false, 
						message: "No items selected in Project Panel" 
					});
				}
				config.manualSelection = selection;
			}
		} else {
			config.sourceItem = app.project.rootItem;
		}
		
		// Find a unique sequence name
		config.sequenceName = findUniqueSequenceName(config.sequenceName);
		
		var result = randomizeItems(config);
		return JSON.stringify(result);
		
	} catch (e) {
		return JSON.stringify({ 
			success: false, 
			message: "Execution error: " + e.toString() 
		});
	}
}
