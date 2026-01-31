// Initialize CSInterface
var csInterface = new CSInterface();

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
