// FILE TREE DISPLAY

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
