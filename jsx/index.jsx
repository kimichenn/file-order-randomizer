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

// Global Vars
var rootItems = app.project.rootItem;
var item = rootItems.children;
var numItems = rootItems.children.numItems;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
function getType(childInd) {
	var meta = rootItems.children[childInd].getProjectMetadata();
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

function selectAllItems(checked) {
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
	if (checked) {
		alert("checked");
	} else {
		alert("not ch3ecked");
	}

	var newSequence = app.project.createNewSequence("Test Sequence", "123xyz");
	var key = {};
	var vals = [];
	for (var i = 0; i < numItems; i++) {
		vals.push(i);
	}
	for (var i = 0; i < numItems; i++) {
		var rand = Math.floor(Math.random() * (numItems - i));
		var y = vals[rand];
		key[i] = y;
		vals.splice(rand, 1);
	}

	var skip = 0;
	var realZero = false;
	for (i = 0; i < numItems; i++) {
		var target = parseInt(getObjKey(key, i));
		if (getType(target) != "Audio") {
			if (i == 0 || realZero == true) {
				newSequence.videoTracks[0].insertClip(
					rootItems.children[target],
					0
				);
				realZero = false;
			} else {
				var numClips = newSequence.videoTracks[0].clips.numItems;
				$.write(numClips);
				$.write(newSequence.videoTracks[0].clips[numClips - 1]);

				var ticks =
					newSequence.videoTracks[0].clips[numClips - 1].end.ticks;
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
