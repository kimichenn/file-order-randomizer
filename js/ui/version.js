// VERSION INFO

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
