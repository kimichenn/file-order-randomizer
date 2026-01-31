// AUDIO HANDLING STATE MANAGEMENT

function updateAudioHandlingState() {
	var filterType = document.getElementById("filter-type").value;
	var audioHandlingRadios = document.querySelectorAll('input[name="audio-handling"]');
	var audioHandlingLabels = document.querySelectorAll('.radio-label');
	
	// Disable when only audio or only video is selected
	var shouldDisable = filterType === "audio" || filterType === "video" || filterType === "image";
	
	for (var i = 0; i < audioHandlingRadios.length; i++) {
		audioHandlingRadios[i].disabled = shouldDisable;
		
		// Find the parent label and add/remove disabled class
		var parentLabel = audioHandlingRadios[i].closest('.radio-label');
		if (parentLabel) {
			if (shouldDisable) {
				parentLabel.classList.add('disabled');
			} else {
				parentLabel.classList.remove('disabled');
			}
		}
	}
}

// ============================================================================
// IMAGE DURATION STATE MANAGEMENT
// ============================================================================

function updateImageDurationState() {
	var filterType = document.getElementById("filter-type").value;
	var imageDurationInput = document.getElementById("image-duration");
	var imageDurationGroup = document.getElementById("image-duration-group");
	
	// Enable only when "all" or "image" is selected
	var shouldEnable = filterType === "all" || filterType === "image";
	
	if (shouldEnable) {
		imageDurationInput.disabled = false;
		imageDurationGroup.classList.remove('disabled');
	} else {
		imageDurationInput.disabled = true;
		imageDurationGroup.classList.add('disabled');
	}
}
