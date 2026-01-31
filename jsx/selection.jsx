// PUBLIC API FUNCTIONS (called from JavaScript side)

/**
 * Helper: Safely get child count from a bin/item
 */
function getChildCount(item) {
	try {
		if (item && item.children && typeof item.children.numItems !== "undefined") {
			return item.children.numItems;
		}
		return 0;
	} catch (e) {
		return 0;
	}
}

/**
 * Get current selection info
 */
function getSelectionInfo() {
	try {
		var selection = app.getCurrentProjectViewSelection();
		
		// Determine selection mode
		var mode = "manual";
		var binName = "";
		var itemCount = 0;
		var isImplicit = false;
		
		if (selection && selection.length === 1 && selection[0].type === 2) {
			// Single bin selected explicitly
			mode = "bin";
			binName = selection[0].name;
			itemCount = getChildCount(selection[0]);
		} else if (selection && selection.length > 0) {
			// Multiple items or non-bin items selected
			mode = "manual";
			itemCount = selection.length;
		} else {
			// No selection, check for active bin (insertion bin)
			var activeBin = app.project.getInsertionBin();
			if (activeBin && activeBin.type === 2) {
				mode = "bin";
				binName = activeBin.name;
				itemCount = getChildCount(activeBin);
				isImplicit = true;
			} else {
				mode = "none";
			}
		}
		
		var message = "";
		if (mode === "bin") {
			message = (isImplicit ? "Active Bin: " : "Selected Bin: ") + binName + " (" + itemCount + " items)";
		} else if (mode === "manual") {
			message = itemCount + " item(s) selected";
		} else {
			message = "No items selected";
		}
		
		return JSON.stringify({
			mode: mode,
			count: itemCount,
			binName: binName,
			isImplicit: isImplicit,
			message: message
		});
	} catch (e) {
		return JSON.stringify({ 
			mode: "error", 
			count: 0,
			message: "Error: " + e.toString()
		});
	}
}
