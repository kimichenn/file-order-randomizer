// var form = document.getElementById("select-type-form");

// form.addEventListener("submit", function (e) {
// 	e.preventDefault();
// 	var selectType = document.querySelector(
// 		"input[name='select-type']:checked"
// 	).value;
// 	console.log(selectType);
// 	switch (selectType) {
// 		case "all":
// 			selectAllItems();
// 			break;
// 		case "user":
// 			selectItemsFromUser();
// 			break;
// 		case "filetype":
// 			selectItemsOfType();
// 			break;
// 		case "bin":
// 			selectItemsFromBin();
// 	}
// });

var csInterface = new CSInterface();

var typeButton = document.querySelector("#type-button");
typeButton.addEventListener("click", selectItemsOfType);

// var allButton = document.querySelector("#all-button");
// allButton.addEventListener("click", selectAllItems);

// var refreshButton = document.querySelector("#refresh-button");
// refreshButton.addEventListener("click", refreshSelection);

function selectItemsOfType() {
	csInterface.evalScript("selectItemsOfType()", function (res) {
		console.log(res);
	});
}

function selectAllItems() {
	console.log("aaah");
	var checked = document.getElementById("include-bin").checked;
	var gapAll = parseInt(document.getElementById("gap-all").value);
	csInterface.evalScript(
		"selectAllItems(" + checked + "," + gapAll + ")",
		function (res) {
			console.log(res);
			window.location.href = "../index.html";
		}
	);
}

function selectItemsFromUser() {
	console.log("aaajh");
	csInterface.evalScript("selectItemsFromUser()", function (res) {
		console.log(res);
	});
}

function refreshSelection() {
	console.log("refresh");
	csInterface.evalScript("refreshSelection()", function (res) {
		// var numElements = JSON.parse(JSON.stringify(res));

		var parsedRes = JSON.parse(res);
		var numElements = Object.keys(parsedRes).length;
		// var type = typeof JSON.parse(res);

		document.getElementById("elements-selected").innerHTML =
			numElements + " item(s) selected.";
	});
}

function selectItemsFromBin() {
	console.log("aaajh");
	csInterface.evalScript("selectItemsFromBin()", function (res) {
		console.log(res);
	});
}
