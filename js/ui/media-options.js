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
	var imageDurationGroup = document.getElementById("image-duration-group");
	var randomizeInput = document.getElementById("randomize-image-duration");
	
	// Enable only when "all" or "image" is selected
	var shouldEnable = filterType === "all" || filterType === "image";
	
	if (shouldEnable) {
		imageDurationGroup.classList.remove('disabled');
		randomizeInput.disabled = false;
		updateImageDurationModeState();
	} else {
		imageDurationGroup.classList.add('disabled');
		randomizeInput.disabled = true;
		document.getElementById("image-duration").disabled = true;
		document.getElementById("image-duration-min").disabled = true;
		document.getElementById("image-duration-max").disabled = true;
	}
}

function updateImageDurationModeState() {
	var filterType = document.getElementById("filter-type").value;
	var shouldEnable = filterType === "all" || filterType === "image";
	var shouldRandomize = document.getElementById("randomize-image-duration").checked;
	var fixedFields = document.getElementById("fixed-image-duration-fields");
	var randomFields = document.getElementById("random-image-duration-fields");
	var helpText = document.getElementById("image-duration-help");

	if (shouldRandomize) {
		fixedFields.classList.add("hidden");
		randomFields.classList.remove("hidden");
		helpText.textContent = "Each image gets a duration within this range";
	} else {
		fixedFields.classList.remove("hidden");
		randomFields.classList.add("hidden");
		helpText.textContent = "Leave blank to use Premiere's default";
	}

	document.getElementById("image-duration").disabled = !shouldEnable || shouldRandomize;
	document.getElementById("image-duration-min").disabled = !shouldEnable || !shouldRandomize;
	document.getElementById("image-duration-max").disabled = !shouldEnable || !shouldRandomize;
}

function getImageDurationSettings() {
	var filterType = document.getElementById("filter-type").value;
	var shouldApply = filterType === "all" || filterType === "image";
	var shouldRandomize = shouldApply && document.getElementById("randomize-image-duration").checked;
	var fixedValue = document.getElementById("image-duration").value.trim();
	var minValue = document.getElementById("image-duration-min").value.trim();
	var maxValue = document.getElementById("image-duration-max").value.trim();

	return {
		shouldApply: shouldApply,
		randomize: shouldRandomize,
		imageDuration: shouldApply && !shouldRandomize && fixedValue !== "" ? parseFloat(fixedValue) : null,
		imageDurationMin: shouldRandomize && minValue !== "" ? parseFloat(minValue) : null,
		imageDurationMax: shouldRandomize && maxValue !== "" ? parseFloat(maxValue) : null
	};
}

function getImageDurationValidationError() {
	var settings = getImageDurationSettings();

	if (!settings.shouldApply) {
		return null;
	}

	if (settings.randomize) {
		if (settings.imageDurationMin === null || settings.imageDurationMax === null ||
			isNaN(settings.imageDurationMin) || isNaN(settings.imageDurationMax) ||
			!isFinite(settings.imageDurationMin) || !isFinite(settings.imageDurationMax)) {
			return "Enter both a minimum and maximum image duration.";
		}
		if (settings.imageDurationMin <= 0 || settings.imageDurationMax <= 0) {
			return "Image durations must be greater than zero.";
		}
		if (settings.imageDurationMin > settings.imageDurationMax) {
			return "Minimum image duration cannot exceed the maximum.";
		}
	} else if (settings.imageDuration !== null &&
		(isNaN(settings.imageDuration) || !isFinite(settings.imageDuration) || settings.imageDuration <= 0)) {
		return "Image duration must be greater than zero.";
	}

	return null;
}
