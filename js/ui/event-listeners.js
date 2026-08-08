// EVENT LISTENERS

function initializeEventListeners() {
	// Mode selection
	var modeRadios = document.querySelectorAll('input[name="mode"]');
	for (var i = 0; i < modeRadios.length; i++) {
		modeRadios[i].addEventListener("change", handleModeChange);
	}
	
	// Options that affect preview count
	document.getElementById("nesting-depth").addEventListener("change", updatePreview);
	document.getElementById("filter-type").addEventListener("change", function() {
		updateAudioHandlingState();
		updateImageDurationState();
		updatePreview();
	});
	document.getElementById("include-sequences").addEventListener("change", updatePreview);
	document.getElementById("randomize-image-duration").addEventListener("change", function() {
		updateImageDurationModeState();
		validateAndUpdateButton();
	});

	var imageDurationInputs = ["image-duration", "image-duration-min", "image-duration-max"];
	for (var j = 0; j < imageDurationInputs.length; j++) {
		document.getElementById(imageDurationInputs[j]).addEventListener("input", validateAndUpdateButton);
	}
	
	// Create button
	document.getElementById("create-button").addEventListener("click", handleCreateSequence);
	
	// File tree toggle
	document.getElementById("file-tree-toggle").addEventListener("click", toggleFileTree);
}

function handleModeChange(e) {
	state.currentMode = e.target.value;
	updateSelectionStatus();
	updatePreview();
}
