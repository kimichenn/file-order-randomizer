// PREVIEW & VALIDATION

function updatePreview() {
	var mode = state.currentMode;
	var nestingDepth = parseInt(document.getElementById("nesting-depth").value);
	var filterType = document.getElementById("filter-type").value;
	var includeSequences = document.getElementById("include-sequences").checked;
	
	csInterface.evalScript("countItemsForRandomization('" + mode + "', " + nestingDepth + ", '" + filterType + "', " + includeSequences + ")", function(result) {
		try {
			var previewData = JSON.parse(result);
			state.previewCount = previewData.count;
			state.fileTree = previewData.fileTree;
			updatePreviewDisplay(previewData);
			updateFileTreeDisplay(previewData.fileTree, previewData.count);
			validateAndUpdateButton();
		} catch (e) {
			console.error("Failed to parse preview data:", e);
			state.previewCount = 0;
			state.fileTree = null;
			updatePreviewDisplay({ count: 0, message: "Error calculating preview" });
			updateFileTreeDisplay(null, 0);
		}
	});
}

function updatePreviewDisplay(previewData) {
	var previewText = document.getElementById("preview-text");
	var previewIcon = document.getElementById("preview-icon");
	
	if (previewData.count > 0) {
		previewText.textContent = "Ready to randomize " + previewData.count + " item" + (previewData.count !== 1 ? "s" : "");
		previewIcon.textContent = "🎬";
	} else {
		previewText.textContent = previewData.message || "No items to randomize";
		previewIcon.textContent = "⚠️";
	}
}

function validateAndUpdateButton() {
	var createButton = document.getElementById("create-button");
	var errorBox = document.getElementById("error-message");
	var mode = state.currentMode;
	var info = state.selectionInfo;
	
	// Clear previous error
	errorBox.className = "error-box hidden";
	errorBox.textContent = "";
	
	// Validation checks
	if (state.isProcessing) {
		createButton.disabled = true;
		return;
	}
	
	if (mode === "bin" && (!info || info.mode !== "bin")) {
		createButton.disabled = true;
		errorBox.textContent = "Please select a bin or navigate into a bin in the Project Panel";
		errorBox.className = "error-box";
		return;
	}
	
	if (mode === "manual" && (!info || info.count === 0)) {
		createButton.disabled = true;
		errorBox.textContent = "Please select items in Premiere Pro's Project Panel";
		errorBox.className = "error-box";
		return;
	}
	
	if (state.previewCount === 0) {
		createButton.disabled = true;
		errorBox.textContent = "No items found matching your criteria. Try adjusting filters or nesting depth.";
		errorBox.className = "error-box";
		return;
	}
	
	// All validations passed
	createButton.disabled = false;
}
