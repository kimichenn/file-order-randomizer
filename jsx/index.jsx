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

// Global Vars
var rootItems = app.project.rootItem;
var item = rootItems.children;
var numItems = rootItems.children.numItems;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var selection = app.getCurrentProjectViewSelection();

function refreshSelection() {
	selection = app.getCurrentProjectViewSelection();
	// return JSON.lave(selection);
	return JSON.stringify(selection);
}

function selectItemsFromUser() {
	alert("selected " + selection.length.toString() + " items");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function selectItemsOfType() {
	app.project.rootItem.children[0].select();
	alert(
		rootItems.children[0].name +
			" has been selected; type: " +
			rootItems.children[0].type
	);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Select All Items
function getObjKey(obj, value) {
	return Object.keys(obj).find(function (key) {
		return obj[key] === value;
	});
}

function selectAllItems(checked, gapSeconds) {
	// redefine vars to avoid changing bin
	rootItems = app.project.rootItem;
	item = rootItems.children;
	numItems = rootItems.children.numItems;

	// default value
	gapSeconds = typeof gapSeconds !== "undefined" ? gapSeconds : 0;

	// Helper Functions
	function getType(childInd) {
		try {
			var meta = rootItems.children[childInd].getProjectMetadata();
		} catch (e) {
			var meta = binItemAssignments[childInd].getProjectMetadata();
		}
		var start =
			meta.indexOf(
				"<premierePrivateProjectMetaData:Column.Intrinsic.MediaType>"
			) + 59;
		var end = meta.indexOf(
			"</premierePrivateProjectMetaData:Column.Intrinsic.MediaType>"
		);
		var res = meta.slice(start, end);
		return res;
	}

	// var projectItems = [];
	// var newSequence = app.project.createNewSequence("Test Sequence", "123xyz");

	// for (i = 0; i < rootItems.children.numItems; i++) {
	// 	if (i == 0) {
	// 		newSequence.videoTracks[0].insertClip(rootItems.children[i], 0);
	// 	} else {
	// 		var ticks = newSequence.videoTracks[0].clips[i - 1].end.ticks;
	// 		// alert(ticks.toString());
	// 		newSequence.videoTracks[0].insertClip(rootItems.children[i], ticks);
	// 		// newSequence.videoTracks[0].overwriteClip(rootItems.children[i], 0);
	// 	}
	// }
	var binInd = {};
	var binItemIds = [];
	// for (var i = 0; i < numItems; i++) {
	// 	if (rootItems.children[i].type == 2) {
	// 		var childItemNum = rootItems.children[i];

	// 		// set the index of each bin with the value of the number of items inside
	// 		binInd[i] = childItemNum.children.numItems;

	// 		// dump nodeids of every item in all the bins into this list
	// 		for (var j = 0; j < childItemNum.children.numItems; j++) {
	// 			binItemIds.push(childItemNum.children[j].nodeId);
	// 		}
	// 	}
	// }

	// var newSequence = app.project.createNewSequence("Test Sequence", "123xyz");
	for (i = 0; i < numItems; i++) {
		if (rootItems.children[i].type == 2) {
			var childItemNum = rootItems.children[i];

			// set the index of each bin with the value of the number of items inside
			binInd[i] = childItemNum.children.numItems;

			// dump the objects of every item in all the bins into this list
			for (var j = 0; j < childItemNum.children.numItems; j++) {
				binItemIds.push(childItemNum.children[j]);
			}
		}
	}

	var newSequence = app.project.createNewSequence("Test Sequence", "123xyz");

	// Set binSum to the total number of items across all bins
	var binAmtArr = Object.values(binInd);
	var binSum = 0;
	var numBins = Object.keys(binInd).length;
	for (var i = 0; i < binAmtArr.length; i++) {
		binSum += binAmtArr[i];
	}

	var binItemAssignments = {};

	var allVals = [];
	for (var i = 0; i < numItems + binSum; i++) {
		// Add the indexes of all items (excluding bin itself, but items in bins are added [would be the numbers at the end])
		if (Object.keys(binInd).indexOf(i.toString()) == -1) {
			allVals.push(i);
		} else {
			// binItemAssignments[] = i;
		}

		// Once i exceeds the numItems, meaning that it is using the extra numbers designated for the bins,
		// it assign the extra numbers designted for the bins to its corresponding object
		// then removes it from the original list (binItemIds)
		if (i >= numItems) {
			binItemAssignments[i] = binItemIds[0];
			binItemIds.splice(0, 1);
		}
	}

	var orderKey = [];

	for (var i = 0; i < numItems + binSum - numBins; i++) {
		var rand = Math.floor(
			Math.random() * (numItems + binSum - numBins - i)
		);
		var y = allVals[rand];
		orderKey.push(y);
		allVals.splice(rand, 1);
	}

	// TODO
	// The for loop just above TODO needs to be modified to add rng on the extra indexes
	// i < numItems + extra
	// Math.random() part
	//
	//
	// binAssignment has each projectitem's nodeid corresponding to their imaginary indexes ie 32 33
	// if target == undefined/null --> search in binAssignment and fetch item
	var skip = 0;
	var realZero = false;
	var gapTicks = gapSeconds * 254016000000;

	if (checked) {
		for (i = 0; i < numItems + binSum - numBins; i++) {
			var target = parseInt(orderKey[i]);
			if (getType(target) != "Audio" && getType(target) != "Sequence") {
				if (i == 0 || realZero == true) {
					if (target < numItems) {
						newSequence.videoTracks[0].insertClip(
							rootItems.children[target],
							0
						);
					} else {
						newSequence.videoTracks[0].insertClip(
							binItemAssignments[target],
							0
						);
					}
					realZero = false;
				} else {
					var numClips = newSequence.videoTracks[0].clips.numItems;

					// var ticks_1 = newSequence.videoTracks[0].clips[numClips - 1];
					// var ticks = newSequence.videoTracks[0].clips[numClips - 1].end.ticks;
					var ticks = (
						parseInt(newSequence.end) + gapTicks
					).toString();

					// 0 to 29: numItems
					// 30 to 36: items in bin
					if (target < numItems) {
						newSequence.videoTracks[0].insertClip(
							rootItems.children[target],
							ticks
						);
					} else {
						newSequence.videoTracks[0].insertClip(
							binItemAssignments[target],
							ticks
						);
					}

					skip = 0;
				}
			} else {
				if (i == 0) {
					realZero = true;
				} else {
					skip++;
				}
			}
		}
	} else {
		// Clean up orderKey list
		var removeList = Object.keys(binItemAssignments);
		removeList.forEach(function (e) {
			orderKey.splice(orderKey.indexOf(parseInt(e)), 1);
		});

		for (i = 0; i < numItems - numBins; i++) {
			var target = parseInt(orderKey[i]);
			if (getType(target) != "Audio") {
				if (i == 0 || realZero == true) {
					newSequence.videoTracks[0].insertClip(
						rootItems.children[target],
						0
					);
					realZero = false;
				} else {
					var numClips = newSequence.videoTracks[0].clips.numItems;

					// var ticks_1 = newSequence.videoTracks[0].clips[numClips - 1];
					// var ticks = newSequence.videoTracks[0].clips[numClips - 1].end.ticks;
					var ticks = (
						parseInt(newSequence.end) + gapTicks
					).toString();

					// 0 to 29: numItems
					// 30 to 36: items in bin

					newSequence.videoTracks[0].insertClip(
						rootItems.children[target],
						ticks
					);

					skip = 0;
				}
			} else {
				if (i == 0) {
					realZero = true;
				} else {
					skip++;
				}
			}
		}
	}

	// var skip = 0;
	// var realZero = false;
	// for (i = 0; i < numItems; i++) {
	// 	var target = parseInt(getObjKey(orderKey, i));
	// 	if (getType(target) != "Audio") {
	// 		if (i == 0 || realZero == true) {
	// 			newSequence.videoTracks[0].insertClip(
	// 				rootItems.children[target],
	// 				0
	// 			);
	// 			realZero = false;
	// 		} else {
	// 			var numClips = newSequence.videoTracks[0].clips.numItems;

	// 			var ticks =
	// 				newSequence.videoTracks[0].clips[numClips - 1].end.ticks;
	// 			newSequence.videoTracks[0].insertClip(
	// 				rootItems.children[target],
	// 				ticks
	// 			);
	// 			skip = 0;
	// 		}
	// 	} else {
	// 		if (i == 0) {
	// 			realZero = true;
	// 		} else {
	// 			skip++;
	// 		}
	// 	}
	// }

	// for (i = 0; i < rootItems.children.numItems; i++) {
	// 	if (i == 0) {
	// 		newSequence.videoTracks[0].insertClip(rootItems.children[i], 0);
	// 	} else {
	// 		var ticks = newSequence.videoTracks[0].clips[i - 1].end.ticks;
	// 		// alert(ticks.toString());
	// 		newSequence.videoTracks[0].insertClip(rootItems.children[i], ticks);
	// 		// newSequence.videoTracks[0].overwriteClip(rootItems.children[i], 0);
	// 	}
	// }
	// newSequence.videoTracks[0].insertClip(rootItems.children[0], 0);

	// for (i = 0; i < rootItems.children.numItems; i++) {
	// 	// app.project.rootItem.children[i].select();
	// 	projectItems.push(rootItems.children[i]);
	// }
	// var newSequence = app.project.createNewSequenceFromClips(
	// 	"New Sequence",
	// 	projectItems
	// );
}
