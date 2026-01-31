// SEQUENCE CREATION

function handleCreateSequence() {
	if (state.isProcessing) {
		return;
	}
	
	var sequenceName = document.getElementById("sequence-name").value.trim();
	if (!sequenceName) {
		sequenceName = "Randomized Sequence";
	}
	
	// Gather configuration
	var config = {
		mode: state.currentMode,
		nestingDepth: parseInt(document.getElementById("nesting-depth").value),
		separateAudio: document.querySelector('input[name="audio-handling"]:checked').value === "separate",
		gapSeconds: parseFloat(document.getElementById("gap-seconds").value) || 0,
		filterType: document.getElementById("filter-type").value,
		sequenceName: sequenceName,
		includeSequences: document.getElementById("include-sequences").checked,
		imageDuration: parseFloat(document.getElementById("image-duration").value) || null
	};
	
	// Disable button and show processing state
	state.isProcessing = true;
	var createButton = document.getElementById("create-button");
	var originalText = createButton.textContent;
	createButton.disabled = true;
	createButton.textContent = "Creating Sequence...";
	
	// Execute randomization
	var configJSON = JSON.stringify(config);
	csInterface.evalScript("executeRandomization('" + escapeJSONString(configJSON) + "')", function(result) {
		state.isProcessing = false;
		createButton.textContent = originalText;
		
		try {
			var response = JSON.parse(result);
			handleSequenceCreationResponse(response);
		} catch (e) {
			showError("Failed to parse response: " + e.toString());
		}
		
		validateAndUpdateButton();
	});
}

function handleSequenceCreationResponse(response) {
	var errorBox = document.getElementById("error-message");
	
	if (response.success) {
		// Success! The message from JSX includes the actual sequence name used
		showToast(response.message, "success", 4000);
		errorBox.className = "error-box hidden";
		
		// Note: The sequence name field stays as the user set it.
		// If duplicates exist, the JSX automatically appends " 1", " 2", etc.
		// This keeps the field clean while preventing duplicate names.
	} else {
		// Error
		showError(response.message || "Unknown error occurred");
	}
}

function showError(message) {
	var errorBox = document.getElementById("error-message");
	errorBox.textContent = "Error: " + message;
	errorBox.className = "error-box";
	showToast(message, "error", 5000);
}
