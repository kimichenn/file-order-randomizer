// Initialize CSInterface
var csInterface = new CSInterface();

// State management
var state = {
	currentMode: "all",
	selectionInfo: null,
	previewCount: 0,
	isProcessing: false
};

// Polling interval for selection detection
var selectionPollingInterval = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", function() {
	initializeEventListeners();
	startSelectionPolling();
	updateAudioHandlingState();
	updateImageDurationState();
	updatePreview();
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

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
}

function handleModeChange(e) {
	state.currentMode = e.target.value;
	updateSelectionStatus();
	updatePreview();
}

// ============================================================================
// AUDIO HANDLING STATE MANAGEMENT
// ============================================================================

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

// ============================================================================
// SELECTION POLLING & DETECTION
// ============================================================================

function startSelectionPolling() {
	// Poll every 500ms
	selectionPollingInterval = setInterval(function() {
		updateSelectionInfo();
	}, 500);
	
	// Initial update
	updateSelectionInfo();
}

function updateSelectionInfo() {
	csInterface.evalScript("getSelectionInfo()", function(result) {
		try {
			state.selectionInfo = JSON.parse(result);
			updateSelectionStatus();
			updatePreview();
		} catch (e) {
			console.error("Failed to parse selection info:", e);
		}
	});
}

function updateSelectionStatus() {
	var statusBox = document.getElementById("selection-status");
	
	if (!state.selectionInfo) {
		statusBox.textContent = "Detecting selection...";
		statusBox.className = "status-box";
		return;
	}
	
	var mode = state.currentMode;
	var info = state.selectionInfo;
	
	if (mode === "all") {
		statusBox.textContent = "Mode: All project items at root level";
		statusBox.className = "status-box success";
	} else if (mode === "bin") {
		if (info.mode === "bin") {
			statusBox.textContent = "✓ " + info.message;
			statusBox.className = "status-box success";
		} else {
			statusBox.textContent = "⚠ Please select a bin or navigate into one";
			statusBox.className = "status-box warning";
		}
	} else if (mode === "manual") {
		if (info.count > 0) {
			statusBox.textContent = "✓ " + info.message;
			statusBox.className = "status-box success";
		} else {
			statusBox.textContent = "⚠ Please select items in the Project Panel";
			statusBox.className = "status-box warning";
		}
	}
}

// ============================================================================
// PREVIEW & VALIDATION
// ============================================================================

function updatePreview() {
	var mode = state.currentMode;
	var nestingDepth = parseInt(document.getElementById("nesting-depth").value);
	var filterType = document.getElementById("filter-type").value;
	var includeSequences = document.getElementById("include-sequences").checked;
	
	csInterface.evalScript("countItemsForRandomization('" + mode + "', " + nestingDepth + ", '" + filterType + "', " + includeSequences + ")", function(result) {
		try {
			var previewData = JSON.parse(result);
			state.previewCount = previewData.count;
			updatePreviewDisplay(previewData);
			validateAndUpdateButton();
		} catch (e) {
			console.error("Failed to parse preview data:", e);
			state.previewCount = 0;
			updatePreviewDisplay({ count: 0, message: "Error calculating preview" });
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

// ============================================================================
// SEQUENCE CREATION
// ============================================================================

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

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

function showToast(message, type, duration) {
	type = type || "info"; // "success", "error", "info"
	duration = duration || 3000;
	
	var container = document.getElementById("toast-container");
	var toast = document.createElement("div");
	toast.className = "toast toast-" + type;
	
	var icon = document.createElement("span");
	icon.className = "toast-icon";
	icon.textContent = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
	
	var messageEl = document.createElement("span");
	messageEl.className = "toast-message";
	messageEl.textContent = message;
	
	toast.appendChild(icon);
	toast.appendChild(messageEl);
	container.appendChild(toast);
	
	// Auto dismiss
	setTimeout(function() {
		toast.classList.add("fade-out");
		setTimeout(function() {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 300);
	}, duration);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeJSONString(str) {
	return str.replace(/\\/g, "\\\\")
	          .replace(/"/g, '\\"')
	          .replace(/'/g, "\\'");
}
