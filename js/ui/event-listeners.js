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
