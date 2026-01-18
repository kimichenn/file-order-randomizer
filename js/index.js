// Initialize CSInterface
var csInterface = new CSInterface();

// State management
var state = {
	currentMode: "all",
	selectionInfo: null,
	previewCount: 0,
	isProcessing: false,
	fileTree: null,
	fileTreeExpanded: false,
	fileTreeHash: null,
	expandedNodes: {}
};

// Polling interval for selection detection
var selectionPollingInterval = null;
var lastSelectionHash = null;
var previewUpdatePending = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", function() {
	initializeEventListeners();
	initializeTooltips();
	initializeModal();
	loadVersionInfo();
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
	
	// File tree toggle
	document.getElementById("file-tree-toggle").addEventListener("click", toggleFileTree);
}

// ============================================================================
// VERSION INFO
// ============================================================================

function loadVersionInfo() {
	// Fetch version from manifest.xml
	var xhr = new XMLHttpRequest();
	xhr.open('GET', './CSXS/manifest.xml', true);
	xhr.onload = function() {
		if (xhr.status === 200) {
			try {
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(xhr.responseText, "text/xml");
				
				// Get version from Extension element
				var extensionElement = xmlDoc.querySelector('Extension[Id="file.order.randomizer"]');
				if (extensionElement) {
					var version = extensionElement.getAttribute('Version');
					document.getElementById('extension-version').textContent = version || 'Unknown';
				} else {
					document.getElementById('extension-version').textContent = 'Unknown';
				}
			} catch (e) {
				console.error('Failed to parse manifest.xml:', e);
				document.getElementById('extension-version').textContent = 'Error';
			}
		} else {
			document.getElementById('extension-version').textContent = 'Unknown';
		}
	};
	xhr.onerror = function() {
		document.getElementById('extension-version').textContent = 'Unknown';
	};
	xhr.send();
}

// ============================================================================
// INFO MODAL
// ============================================================================

function initializeModal() {
	var infoBtn = document.getElementById("info-menu-btn");
	var modal = document.getElementById("info-modal");
	var closeBtn = document.getElementById("modal-close-btn");
	var overlay = modal.querySelector(".modal-overlay");
	var linkBtns = modal.querySelectorAll(".modal-link-btn");
	
	// Open modal
	infoBtn.addEventListener("click", function() {
		modal.classList.remove("hidden");
	});
	
	// Close modal
	function closeModal() {
		modal.classList.add("hidden");
	}
	
	closeBtn.addEventListener("click", closeModal);
	overlay.addEventListener("click", closeModal);
	
	// External link buttons
	for (var i = 0; i < linkBtns.length; i++) {
		linkBtns[i].addEventListener("click", function() {
			var url = this.getAttribute("data-url");
			if (url) {
				openExternalLink(url);
			}
		});
	}
	
	// Close modal on ESC key
	document.addEventListener("keydown", function(e) {
		if (e.key === "Escape" && !modal.classList.contains("hidden")) {
			closeModal();
		}
	});
}

function openExternalLink(url) {
	// Use CSInterface to open external links properly in CEP extensions
	csInterface.openURLInDefaultBrowser(url);
}

// ============================================================================
// TOOLTIP POSITIONING
// ============================================================================

function initializeTooltips() {
	var tooltipWrappers = document.querySelectorAll('.tooltip-wrapper');
	
	for (var i = 0; i < tooltipWrappers.length; i++) {
		tooltipWrappers[i].addEventListener('mouseenter', positionTooltip);
		tooltipWrappers[i].addEventListener('mousemove', positionTooltip);
	}
}

function positionTooltip(e) {
	var wrapper = e.currentTarget;
	var tooltip = wrapper.querySelector('.tooltip-content');
	if (!tooltip) return;
	
	var icon = wrapper.querySelector('.tooltip-icon');
	if (!icon) return;
	
	var rect = icon.getBoundingClientRect();
	var tooltipRect = tooltip.getBoundingClientRect();
	
	// Calculate position above the icon
	var left = rect.left + (rect.width / 2);
	var top = rect.top - 8;
	
	// Adjust if tooltip would go off the right edge
	var tooltipWidth = tooltipRect.width || 260; // fallback to max-width
	var rightEdge = left + (tooltipWidth / 2);
	if (rightEdge > window.innerWidth - 10) {
		left = window.innerWidth - tooltipWidth / 2 - 10;
	}
	
	// Adjust if tooltip would go off the left edge
	var leftEdge = left - (tooltipWidth / 2);
	if (leftEdge < 10) {
		left = tooltipWidth / 2 + 10;
	}
	
	tooltip.style.left = left + 'px';
	tooltip.style.top = top + 'px';
	tooltip.style.transform = 'translate(-50%, -100%)';
}

// ============================================================================
// END TOOLTIP POSITIONING
// ============================================================================


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
// FILE TREE DISPLAY
// ============================================================================

function toggleFileTree(e) {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}
	
	var toggleBtn = document.getElementById("file-tree-toggle");
	var content = document.getElementById("file-tree-content");
	
	state.fileTreeExpanded = !state.fileTreeExpanded;
	
	if (state.fileTreeExpanded) {
		toggleBtn.classList.add("expanded");
		content.classList.remove("hidden");
		updateToggleText(state.previewCount);
	} else {
		toggleBtn.classList.remove("expanded");
		content.classList.add("hidden");
		updateToggleText(state.previewCount);
	}
}

function updateToggleText(count) {
	var toggleText = document.getElementById("file-tree-toggle").querySelector(".toggle-text");
	var label = state.fileTreeExpanded ? "Hide Files" : "Show Files";
	if (count > 0) {
		label += " (" + count + ")";
	}
	toggleText.textContent = label;
}

function hashFileTree(tree) {
	// Create a simple hash to detect if tree data changed
	if (!tree) return null;
	return JSON.stringify(tree);
}

function updateFileTreeDisplay(fileTree, count) {
	var container = document.getElementById("file-tree-container");
	var treeEl = document.getElementById("file-tree");
	
	if (!fileTree || count === 0) {
		container.classList.add("hidden");
		treeEl.innerHTML = "";
		state.fileTreeHash = null;
		return;
	}
	
	container.classList.remove("hidden");
	
	// Update toggle text
	updateToggleText(count);
	
	// Check if tree data actually changed
	var newHash = hashFileTree(fileTree);
	if (newHash === state.fileTreeHash) {
		// Data hasn't changed, don't re-render
		return;
	}
	
	// Save current expanded states before re-render
	saveExpandedStates();
	
	// Update hash
	state.fileTreeHash = newHash;
	
	// Render the tree
	treeEl.innerHTML = renderFileTree(fileTree);
	
	// Restore expanded states and attach event listeners
	restoreExpandedStates();
	attachTreeNodeListeners();
}

function saveExpandedStates() {
	var expandedNodes = document.querySelectorAll(".tree-node.expanded");
	state.expandedNodes = {};
	for (var i = 0; i < expandedNodes.length; i++) {
		var nameEl = expandedNodes[i].querySelector(".tree-node-name");
		if (nameEl) {
			state.expandedNodes[nameEl.textContent] = true;
		}
	}
}

function restoreExpandedStates() {
	var allNodes = document.querySelectorAll(".tree-node");
	for (var i = 0; i < allNodes.length; i++) {
		var nameEl = allNodes[i].querySelector(".tree-node-name");
		if (nameEl && state.expandedNodes[nameEl.textContent]) {
			allNodes[i].classList.add("expanded");
		}
	}
}

function renderFileTree(node) {
	if (!node) return "";
	
	var html = "";
	var hasChildren = (node.children && node.children.length > 0) || (node.items && node.items.length > 0);
	
	// Calculate total item count for this node
	var totalCount = countTreeItems(node);
	
	// If this is the root and it has no meaningful name, just render children
	if (node.name === "Project Root" || node.name === "Selected Items") {
		// Render items at root level first
		if (node.items && node.items.length > 0) {
			for (var i = 0; i < node.items.length; i++) {
				html += renderFileItem(node.items[i]);
			}
		}
		
		// Render children bins (depth 0 = outermost, auto-expand)
		if (node.children && node.children.length > 0) {
			for (var j = 0; j < node.children.length; j++) {
				html += renderTreeNode(node.children[j], 0);
			}
		}
		
		if (html === "") {
			html = '<div class="file-tree-empty">No files to display</div>';
		}
		
		return html;
	}
	
	return renderTreeNode(node, 0);
}

function renderTreeNode(node, depth) {
	depth = typeof depth !== "undefined" ? depth : 0;
	var hasContent = (node.children && node.children.length > 0) || (node.items && node.items.length > 0);
	var totalCount = countTreeItems(node);
	
	// Auto-expand outermost layer (depth 0) or if user previously expanded
	var isExpanded = depth === 0 || state.expandedNodes[node.name];
	var expandedClass = isExpanded ? " expanded" : "";
	
	// Track auto-expanded nodes in state so they persist
	if (isExpanded) {
		state.expandedNodes[node.name] = true;
	}
	
	var html = '<div class="tree-node' + expandedClass + '">';
	html += '<div class="tree-node-header">';
	
	if (hasContent) {
		html += '<span class="tree-node-toggle">▶</span>';
	} else {
		html += '<span class="tree-node-toggle" style="visibility: hidden;">▶</span>';
	}
	
	html += '<span class="tree-node-icon folder-icon">📁</span>';
	html += '<span class="tree-node-name">' + escapeHtml(node.name) + '</span>';
	html += '<span class="tree-node-count">' + totalCount + '</span>';
	html += '</div>';
	
	if (hasContent) {
		html += '<div class="tree-node-children">';
		
		// Render nested bins (increment depth)
		if (node.children && node.children.length > 0) {
			for (var i = 0; i < node.children.length; i++) {
				html += renderTreeNode(node.children[i], depth + 1);
			}
		}
		
		// Then render files
		if (node.items && node.items.length > 0) {
			for (var j = 0; j < node.items.length; j++) {
				html += renderFileItem(node.items[j]);
			}
		}
		
		html += '</div>';
	}
	
	html += '</div>';
	return html;
}

function renderFileItem(item) {
	var icon = getFileIcon(item.mediaType);
	var html = '<div class="tree-file" data-type="' + escapeHtml(item.mediaType) + '">';
	html += '<span class="tree-file-icon">' + icon + '</span>';
	html += '<span class="tree-file-name">' + escapeHtml(item.name) + '</span>';
	html += '</div>';
	return html;
}

function getFileIcon(mediaType) {
	switch (mediaType) {
		case "Video":
		case "Movie":
			return "🎬";
		case "Audio":
			return "🎵";
		case "Image":
		case "Still":
		case "Still Image":
			return "🖼️";
		case "Sequence":
			return "🎞️";
		default:
			return "📄";
	}
}

function countTreeItems(node) {
	var count = node.items ? node.items.length : 0;
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			count += countTreeItems(node.children[i]);
		}
	}
	return count;
}

function attachTreeNodeListeners() {
	var headers = document.querySelectorAll(".tree-node-header");
	for (var i = 0; i < headers.length; i++) {
		// Remove any existing listeners by cloning
		var oldHeader = headers[i];
		var newHeader = oldHeader.cloneNode(true);
		oldHeader.parentNode.replaceChild(newHeader, oldHeader);
	}
	
	// Re-query after cloning
	headers = document.querySelectorAll(".tree-node-header");
	for (var j = 0; j < headers.length; j++) {
		headers[j].addEventListener("click", handleTreeNodeClick);
	}
}

function handleTreeNodeClick(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var node = this.parentElement;
	var nameEl = node.querySelector(".tree-node-name");
	var nodeName = nameEl ? nameEl.textContent : "";
	
	if (node.classList.contains("expanded")) {
		node.classList.remove("expanded");
		delete state.expandedNodes[nodeName];
	} else {
		node.classList.add("expanded");
		state.expandedNodes[nodeName] = true;
	}
}

function escapeHtml(text) {
	if (!text) return "";
	var div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeJSONString(str) {
	return str.replace(/\\/g, "\\\\")
	          .replace(/"/g, '\\"')
	          .replace(/'/g, "\\'");
}
