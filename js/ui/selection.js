// SELECTION POLLING & DETECTION

function startSelectionPolling() {
	// Poll every 750ms (reduced frequency for better performance)
	selectionPollingInterval = setInterval(function() {
		updateSelectionInfo();
	}, 750);
	
	// Initial update
	updateSelectionInfo();
}

function updateSelectionInfo() {
	csInterface.evalScript("getSelectionInfo()", function(result) {
		try {
			var newInfo = JSON.parse(result);
			var newHash = JSON.stringify(newInfo);
			
			// Only update if selection actually changed
			if (newHash !== lastSelectionHash) {
				lastSelectionHash = newHash;
				state.selectionInfo = newInfo;
				updateSelectionStatus();
				
				// Debounce preview updates
				if (!previewUpdatePending) {
					previewUpdatePending = true;
					setTimeout(function() {
						previewUpdatePending = false;
						updatePreview();
					}, 100);
				}
			}
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
