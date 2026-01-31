/**
 * Helper: Recursively collect items with bin structure for file tree display
 */
function collectItemsWithStructure(parentItem, currentDepth, maxDepth, filterType, includeSequences, parentPath) {
	var result = {
		name: parentItem.name || "Project Root",
		path: parentPath || "",
		type: "bin",
		children: [],
		items: []
	};
	
	if (!parentItem) {
		return result;
	}
	
	// Safely get children count
	var numItems = 0;
	try {
		if (parentItem.children && typeof parentItem.children.numItems !== "undefined") {
			numItems = parentItem.children.numItems;
		}
	} catch (e) {
		return result;
	}
	
	for (var i = 0; i < numItems; i++) {
		try {
			var item = parentItem.children[i];
			if (!item) continue;
			
			var itemType = item.type;
			var currentPath = parentPath ? parentPath + "/" + item.name : item.name;
			
			// Type 2 = Bin
			if (itemType === 2) {
				// If we haven't exceeded depth limit, recurse into this bin
				if (maxDepth === -1 || currentDepth < maxDepth) {
					var nestedResult = collectItemsWithStructure(item, currentDepth + 1, maxDepth, filterType, includeSequences, currentPath);
					// Only add bins that have items or nested children with items
					if (nestedResult.items.length > 0 || nestedResult.children.length > 0) {
						result.children.push(nestedResult);
					}
				}
			} else {
				// Check if it's a sequence (Type 1 can be both clip and sequence)
				var isSequence = false;
				if (typeof item.isSequence !== "undefined") {
					isSequence = item.isSequence();
				}
				
				if (isSequence) {
					// It's a sequence - only include if user opted in
					if (includeSequences) {
						result.items.push({
							name: item.name,
							type: "sequence",
							mediaType: "Sequence"
						});
					}
				} else {
					// It's a media item (clip, file, etc.), check if it matches filter
					if (shouldIncludeItem(item, filterType)) {
						var mediaType = getMediaType(item);
						result.items.push({
							name: item.name,
							type: "media",
							mediaType: mediaType
						});
					}
				}
			}
		} catch (e) {
			// Skip problematic items
			continue;
		}
	}
	
	return result;
}

/**
 * Helper: Count total items in a structure tree
 */
function countItemsInStructure(structure) {
	var count = structure.items.length;
	for (var i = 0; i < structure.children.length; i++) {
		count += countItemsInStructure(structure.children[i]);
	}
	return count;
}

/**
 * Count total items that will be randomized (for preview)
 */
function countItemsForRandomization(mode, nestingDepth, filterType, includeSequences) {
	try {
		var sourceItem;
		var manualSelection = [];
		
		if (mode === "manual") {
			manualSelection = app.getCurrentProjectViewSelection();
			if (manualSelection.length === 0) {
				return JSON.stringify({ count: 0, message: "No items selected", fileTree: null });
			}
		} else if (mode === "bin") {
			var selection = app.getCurrentProjectViewSelection();
			if (selection && selection.length > 0 && selection[0].type === 2) {
				sourceItem = selection[0];
			} else {
				// Try active bin
				var activeBin = app.project.getInsertionBin();
				if (activeBin && activeBin.type === 2) {
					sourceItem = activeBin;
				} else {
					return JSON.stringify({ count: 0, message: "No bin selected", fileTree: null });
				}
			}
		} else {
			sourceItem = app.project.rootItem;
		}
		
		var items = [];
		var fileTree = null;
		
		if (mode === "manual") {
			// For manual selection, group by parent bin
			var manualTree = {
				name: "Selected Items",
				type: "bin",
				children: [],
				items: []
			};
			
			for (var i = 0; i < manualSelection.length; i++) {
				var item = manualSelection[i];
				var itemType = item.type;
				// Skip bins (type 2)
				if (itemType === 2) {
					continue;
				}
				
				// Check if it's a sequence
				var isSequence = false;
				if (typeof item.isSequence !== "undefined") {
					isSequence = item.isSequence();
				}
				
				if (isSequence) {
					if (includeSequences) {
						items.push(item);
						manualTree.items.push({
							name: item.name,
							type: "sequence",
							mediaType: "Sequence"
						});
					}
				} else {
					// Regular media items
					if (shouldIncludeItem(item, filterType)) {
						items.push(item);
						var mediaType = getMediaType(item);
						manualTree.items.push({
							name: item.name,
							type: "media",
							mediaType: mediaType
						});
					}
				}
			}
			fileTree = manualTree;
		} else {
			// Get structured file tree
			fileTree = collectItemsWithStructure(sourceItem, 0, nestingDepth, filterType, includeSequences, "");
			items = collectItemsRecursive(sourceItem, 0, nestingDepth, filterType, includeSequences);
		}
		
		return JSON.stringify({ 
			count: items.length,
			message: items.length + " item(s) will be randomized",
			fileTree: fileTree
		});
	} catch (e) {
		return JSON.stringify({ 
			count: 0,
			message: "Error: " + e.toString(),
			fileTree: null
		});
	}
}
