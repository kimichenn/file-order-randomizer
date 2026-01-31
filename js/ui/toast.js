// TOAST NOTIFICATION SYSTEM

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
