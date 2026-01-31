// TOOLTIP POSITIONING

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
