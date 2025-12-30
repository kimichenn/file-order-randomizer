//@include 'json2.js'

// Polyfills
if (!Object.keys)
	Object.keys = function (o) {
		if (o !== Object(o))
			throw new TypeError("Object.keys called on a non-object");
		var k = [],
			p;
		for (p in o) if (Object.prototype.hasOwnProperty.call(o, p)) k.push(p);
		return k;
	};

Array.prototype.find = function (callback, thisArg) {
	if (!callback || typeof callback !== "function") throw TypeError();
	var size = this.length;
	var that = thisArg || this;
	for (var i = 0; i < size; i++) {
		try {
			if (!!callback.apply(that, [this[i], i, this])) {
				return this[i];
			}
		} catch (e) {
			return undefined;
		}
	}
	return undefined;
};

(function () {
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function forEach(callback, thisArg) {
			if (typeof callback !== "function") {
				throw new TypeError(callback + " is not a function");
			}
			var array = this;
			thisArg = thisArg || this;
			for (var i = 0, l = array.length; i !== l; ++i) {
				callback.call(thisArg, array[i], i, array);
			}
		};
	}
})();

Object.values = function (obj) {
	var res = [];
	for (var i in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, i)) {
			res.push(obj[i]);
		}
	}
	return res;
};

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (obj, start) {
		for (var i = start || 0, j = this.length; i < j; i++) {
			if (this[i] === obj) {
				return i;
			}
		}
		return -1;
	};
}

// ============================================================================
// UNIFIED RANDOMIZATION ENGINE
// ============================================================================

/**
 * Helper: Get media type from project item metadata
 */
function getMediaType(item) {
	try {
		var meta = item.getProjectMetadata();
		var start = meta.indexOf("<premierePrivateProjectMetaData:Column.Intrinsic.MediaType>") + 59;
		var end = meta.indexOf("</premierePrivateProjectMetaData:Column.Intrinsic.MediaType>");
		var type = meta.slice(start, end);
		
		// Normalize types
		if (type === "Still Image") return "Image";
		// Return specific types for logic handling
		return type;
	} catch (e) {
		return "Unknown";
	}
}

/**
 * Helper: Recursively collect items from bins with depth control
 */
function collectItemsRecursive(parentItem, currentDepth, maxDepth, filterType, includeSequences) {
	var items = [];
	
	if (!parentItem) {
		return items;
	}
	
	// Safely get children count
	var numItems = 0;
	try {
		if (parentItem.children && typeof parentItem.children.numItems !== "undefined") {
			numItems = parentItem.children.numItems;
		}
	} catch (e) {
		return items;
	}
	
	for (var i = 0; i < numItems; i++) {
		try {
			var item = parentItem.children[i];
			if (!item) continue;
			
			var itemType = item.type;
			
			// Type 2 = Bin
			if (itemType === 2) {
				// If we haven't exceeded depth limit, recurse into this bin
				if (maxDepth === -1 || currentDepth < maxDepth) {
					var nestedItems = collectItemsRecursive(item, currentDepth + 1, maxDepth, filterType, includeSequences);
					items = items.concat(nestedItems);
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
						items.push(item);
					}
				} else {
					// It's a media item (clip, file, etc.), check if it matches filter
					if (shouldIncludeItem(item, filterType)) {
						items.push(item);
					}
				}
			}
		} catch (e) {
			// Skip problematic items
			continue;
		}
	}
	
	return items;
}

/**
 * Helper: Check if item matches the filter type
 */
function shouldIncludeItem(item, filterType) {
	if (!filterType || filterType === "all") {
		return true;
	}
	
	var mediaType = getMediaType(item);
	
	switch (filterType) {
		case "video":
			return mediaType === "Video" || mediaType === "Movie";
		case "audio":
			return mediaType === "Audio";
		case "image":
			return mediaType === "Image" || mediaType === "Still" || mediaType === "Still Image";
		default:
			return true;
	}
}

/**
 * Helper: Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(arr) {
	var shuffled = [];
	var remaining = arr.slice(); // Create a copy
	
	while (remaining.length > 0) {
		var rand = Math.floor(Math.random() * remaining.length);
		shuffled.push(remaining[rand]);
		remaining.splice(rand, 1);
	}
	
	return shuffled;
}

/**
 * Main unified randomization function
 * @param {Object} config - Configuration object
 * @param {Object} config.sourceItem - Root item or bin item to randomize from
 * @param {String} config.mode - "all" or "bin" or "manual"
 * @param {Number} config.nestingDepth - -1 for unlimited, 0 for current level only, 1+ for depth
 * @param {Boolean} config.separateAudio - Whether to put audio on separate tracks
 * @param {Number} config.gapSeconds - Gap between clips in seconds
 * @param {String} config.filterType - "all", "video", "audio", "image"
 * @param {String} config.sequenceName - Name for the new sequence
 * @param {Boolean} config.includeSequences - Whether to include sequences (default: false)
 * @param {Array} config.manualSelection - Optional array of manually selected items
 * @param {Number} config.imageDuration - Duration for images in seconds (null to use default)
 * @returns {Object} Result object with success status and message
 */
function randomizeItems(config) {
	try {
		// Validate inputs
		if (!config) {
			return { success: false, message: "No configuration provided" };
		}
		
		// Set defaults
		var sourceItem = config.sourceItem || app.project.rootItem;
		var mode = config.mode || "all";
		var nestingDepth = typeof config.nestingDepth !== "undefined" ? config.nestingDepth : 0;
		var separateAudio = config.separateAudio || false;
		var gapSeconds = config.gapSeconds || 0;
		var filterType = config.filterType || "all";
		var sequenceName = config.sequenceName || "Randomized Sequence";
		var includeSequences = config.includeSequences || false;
		var manualSelection = config.manualSelection || [];
		
		var itemsToRandomize = [];
		
		// Collect items based on mode
		if (mode === "manual" && manualSelection.length > 0) {
			// Use manually selected items, applying filter
			for (var i = 0; i < manualSelection.length; i++) {
				var item = manualSelection[i];
				var itemType = item.type;
				// Exclude bins (type 2)
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
						itemsToRandomize.push(item);
					}
				} else {
					// Regular media items
					if (shouldIncludeItem(item, filterType)) {
						itemsToRandomize.push(item);
					}
				}
			}
		} else {
			// Collect from source item with depth control
			itemsToRandomize = collectItemsRecursive(sourceItem, 0, nestingDepth, filterType, includeSequences);
		}
		
		// Validate we have items
		if (itemsToRandomize.length === 0) {
			return { 
				success: false, 
				message: "No items found to randomize. Check your selection and filters." 
			};
		}
		
		// Randomize the order
		var randomizedItems = shuffleArray(itemsToRandomize);
		
		// Create new sequence
		var newSequence;
		try {
			newSequence = app.project.createNewSequence(sequenceName, "randomized_" + Date.now());
		} catch (e) {
			return { 
				success: false, 
				message: "Failed to create sequence: " + e.toString() 
			};
		}
		
		// Calculate gap in ticks (Premiere Pro uses ticks for time)
		var gapTicks = gapSeconds * 254016000000;
		
		// Get image duration (null means use default)
		var imageDuration = config.imageDuration || null;
		
		// Insert clips into sequence
		if (separateAudio) {
			insertClipsSeparateAudioVideo(newSequence, randomizedItems, gapTicks, imageDuration);
		} else {
			insertClipsUnified(newSequence, randomizedItems, gapTicks, imageDuration);
		}
		
		return { 
			success: true, 
			message: "Successfully created sequence '" + sequenceName + "' with " + randomizedItems.length + " randomized items.",
			itemCount: randomizedItems.length
		};
		
	} catch (e) {
		return { 
			success: false, 
			message: "Error during randomization: " + e.toString() 
		};
	}
}

/**
 * Helper: Insert clips with separate audio and video tracks
 * Strategy:
 * 1. Place all video/image clips first to establish the visual timeline and A1 usage.
 * 2. Place audio clips second, filling A1 gaps where possible, otherwise spilling to A2.
 */
function insertClipsSeparateAudioVideo(sequence, items, gapTicks, imageDuration) {
	var audioCursor = "0";
	var videoCursor = "0";
	
	// Ensure we have enough audio tracks (A1, A2, and A3 for temp measurements)
	while (sequence.audioTracks.numTracks < 3) {
		sequence.audioTracks.add();
	}
	
	var primaryAudioTrack = sequence.audioTracks[0];   // A1
	var secondaryAudioTrack = sequence.audioTracks[1]; // A2
	var tempAudioTrack = sequence.audioTracks[sequence.audioTracks.numTracks - 1]; // Last track
	
	var audioItems = [];
	var a1OccupiedRanges = [];
	
	// PASS 1: Place Visuals (Video/Movie/Image)
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		var mediaType = getMediaType(item);
		
		if (mediaType === "Audio") {
			// Queue for Pass 2
			audioItems.push(item);
		} else if (mediaType === "Image" || mediaType === "Still") {
			// Image -> Video Track Only
			sequence.videoTracks[0].insertClip(item, videoCursor);
			var insertedClip = sequence.videoTracks[0].clips[sequence.videoTracks[0].clips.numItems - 1];
			
			// Set custom duration if specified
			if (imageDuration !== null && imageDuration > 0) {
				var startTicks = parseInt(insertedClip.start.ticks);
				var durationTicks = imageDuration * 254016000000;
				insertedClip.end = (startTicks + durationTicks).toString();
			}
			
			videoCursor = (parseInt(insertedClip.end.ticks) + gapTicks).toString();
			// Does not occupy A1
		} else if (mediaType === "Movie") {
			// Movie -> Video Track + Audio Track 1 (has linked audio)
			sequence.videoTracks[0].insertClip(item, videoCursor);
			var insertedClip = sequence.videoTracks[0].clips[sequence.videoTracks[0].clips.numItems - 1];
			
			// Record A1 occupation for movies with audio
			var startTicks = parseInt(insertedClip.start.ticks);
			var endTicks = parseInt(insertedClip.end.ticks);
			a1OccupiedRanges.push({start: startTicks, end: endTicks});
			
			videoCursor = (endTicks + gapTicks).toString();
		} else {
			// Video (without audio) -> Video Track Only
			sequence.videoTracks[0].insertClip(item, videoCursor);
			var insertedClip = sequence.videoTracks[0].clips[sequence.videoTracks[0].clips.numItems - 1];
			
			videoCursor = (parseInt(insertedClip.end.ticks) + gapTicks).toString();
			// Does not occupy A1 since it's video without audio
		}
	}
	
	// PASS 2: Place Audio Clips
	// Strict Separation Rule: 
	// If A1 is occupied by ANY movie audio, force ALL dedicated audio to A2.
	// This prevents "checkerboarding" (some on A1, some on A2) and ensures clean track organization.
	var targetAudioTrack = a1OccupiedRanges.length > 0 ? secondaryAudioTrack : primaryAudioTrack;

	for (var i = 0; i < audioItems.length; i++) {
		var item = audioItems[i];
		
		// 1. Measure Duration using Temp Track
		// Insert at 0 on temp track (which is empty or we don't care)
		tempAudioTrack.insertClip(item, "0");
		var tempClip = tempAudioTrack.clips[tempAudioTrack.clips.numItems - 1];
		
		if (!tempClip) continue; // Safety check
		
		var durationTicks = parseInt(tempClip.end.ticks) - parseInt(tempClip.start.ticks);
		tempClip.remove(false, false); // Remove from temp
		
		// 2. Insert to target track
		targetAudioTrack.insertClip(item, audioCursor);
		
		// Advance cursor
		// Note: We use durationTicks instead of reading the inserted clip to avoid 
		// potential API latency issues, as we already measured it.
		audioCursor = (parseInt(audioCursor) + durationTicks + gapTicks).toString();
	}
}

/**
 * Helper: Insert clips with unified cursor (audio and video together)
 */
function insertClipsUnified(sequence, items, gapTicks, imageDuration) {
	var cursor = "0";
	
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		var mediaType = getMediaType(item);
		
		if (mediaType === "Audio") {
			sequence.audioTracks[0].insertClip(item, cursor);
			var insertedClip = sequence.audioTracks[0].clips[sequence.audioTracks[0].clips.numItems - 1];
			cursor = (parseInt(insertedClip.end.ticks) + gapTicks).toString();
		} else if (mediaType === "Image" || mediaType === "Still") {
			sequence.videoTracks[0].insertClip(item, cursor);
			var insertedClip = sequence.videoTracks[0].clips[sequence.videoTracks[0].clips.numItems - 1];
			
			// Set custom duration if specified
			if (imageDuration !== null && imageDuration > 0) {
				var startTicks = parseInt(insertedClip.start.ticks);
				var durationTicks = imageDuration * 254016000000;
				insertedClip.end = (startTicks + durationTicks).toString();
			}
			
			cursor = (parseInt(insertedClip.end.ticks) + gapTicks).toString();
		} else {
			// Video or Movie (with or without audio)
			// insertClip automatically handles both video and audio components if they exist
			sequence.videoTracks[0].insertClip(item, cursor);
			
			// Calculate cursor from video clip
			var insertedClip = sequence.videoTracks[0].clips[sequence.videoTracks[0].clips.numItems - 1];
			cursor = (parseInt(insertedClip.end.ticks) + gapTicks).toString();
		}
	}
}

// ============================================================================
// PUBLIC API FUNCTIONS (called from JavaScript side)
// ============================================================================

/**
 * Helper: Safely get child count from a bin/item
 */
function getChildCount(item) {
	try {
		if (item && item.children && typeof item.children.numItems !== "undefined") {
			return item.children.numItems;
		}
		return 0;
	} catch (e) {
		return 0;
	}
}

/**
 * Get current selection info
 */
function getSelectionInfo() {
	try {
		var selection = app.getCurrentProjectViewSelection();
		
		// Determine selection mode
		var mode = "manual";
		var binName = "";
		var itemCount = 0;
		var isImplicit = false;
		
		if (selection && selection.length === 1 && selection[0].type === 2) {
			// Single bin selected explicitly
			mode = "bin";
			binName = selection[0].name;
			itemCount = getChildCount(selection[0]);
		} else if (selection && selection.length > 0) {
			// Multiple items or non-bin items selected
			mode = "manual";
			itemCount = selection.length;
		} else {
			// No selection, check for active bin (insertion bin)
			var activeBin = app.project.getInsertionBin();
			if (activeBin && activeBin.type === 2) {
				mode = "bin";
				binName = activeBin.name;
				itemCount = getChildCount(activeBin);
				isImplicit = true;
			} else {
				mode = "none";
			}
		}
		
		var message = "";
		if (mode === "bin") {
			message = (isImplicit ? "Active Bin: " : "Selected Bin: ") + binName + " (" + itemCount + " items)";
		} else if (mode === "manual") {
			message = itemCount + " item(s) selected";
		} else {
			message = "No items selected";
		}
		
		return JSON.stringify({
			mode: mode,
			count: itemCount,
			binName: binName,
			isImplicit: isImplicit,
			message: message
		});
	} catch (e) {
		return JSON.stringify({ 
			mode: "error", 
			count: 0,
			message: "Error: " + e.toString()
		});
	}
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
				return JSON.stringify({ count: 0, message: "No items selected" });
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
					return JSON.stringify({ count: 0, message: "No bin selected" });
				}
			}
		} else {
			sourceItem = app.project.rootItem;
		}
		
		var items = [];
		if (mode === "manual") {
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
					}
				} else {
					// Regular media items
					if (shouldIncludeItem(item, filterType)) {
						items.push(item);
					}
				}
			}
		} else {
			items = collectItemsRecursive(sourceItem, 0, nestingDepth, filterType, includeSequences);
		}
		
		return JSON.stringify({ 
			count: items.length,
			message: items.length + " item(s) will be randomized"
		});
	} catch (e) {
		return JSON.stringify({ 
			count: 0,
			message: "Error: " + e.toString()
		});
	}
}

/**
 * Helper: Check if a sequence name exists in the project
 */
function findUniqueSequenceName(baseName) {
	try {
		var sequences = app.project.sequences;
		var existingNames = {};
		
		// Build a map of existing sequence names
		for (var i = 0; i < sequences.numSequences; i++) {
			existingNames[sequences[i].name] = true;
		}
		
		// If base name doesn't exist, use it
		if (!existingNames[baseName]) {
			return baseName;
		}
		
		// Otherwise, find the next available number
		var counter = 1;
		while (existingNames[baseName + " " + counter]) {
			counter++;
		}
		
		return baseName + " " + counter;
	} catch (e) {
		// If there's an error, just return the base name
		return baseName;
	}
}

/**
 * Execute randomization (main entry point from UI)
 */
function executeRandomization(configJSON) {
	try {
		var config = JSON.parse(configJSON);
		
		// Get source item based on mode
		if (config.mode === "bin" || config.mode === "manual") {
			var selection = app.getCurrentProjectViewSelection();
			
			if (config.mode === "bin") {
				// Check for explicit selection first
				if (selection && selection.length > 0 && selection[0].type === 2) {
					config.sourceItem = selection[0];
				} else {
					// Fallback to active bin
					var activeBin = app.project.getInsertionBin();
					if (activeBin && activeBin.type === 2) {
						config.sourceItem = activeBin;
					} else {
						return JSON.stringify({ 
							success: false, 
							message: "No bin selected or active" 
						});
					}
				}
			} else {
				// Manual mode requires explicit selection
				if (selection.length === 0) {
					return JSON.stringify({ 
						success: false, 
						message: "No items selected in Project Panel" 
					});
				}
				config.manualSelection = selection;
			}
		} else {
			config.sourceItem = app.project.rootItem;
		}
		
		// Find a unique sequence name
		config.sequenceName = findUniqueSequenceName(config.sequenceName);
		
		var result = randomizeItems(config);
		return JSON.stringify(result);
		
	} catch (e) {
		return JSON.stringify({ 
			success: false, 
			message: "Execution error: " + e.toString() 
		});
	}
}
