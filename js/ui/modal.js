// INFO MODAL

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
