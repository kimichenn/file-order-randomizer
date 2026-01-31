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
