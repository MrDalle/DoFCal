//On document load
$(document).ready(function() {
	cookiesName = ["CoC","SelectCoC", "fNumber", "focalLength", "focusDistance"];
	getCookies();
	
	
	$sensorSizeChosen.on("change", cocListener);
	cocListener(); //Set the cocListener to run
	textInputs = [[$inputF,1], [$inputM,1], [$inputDcm,1], [$inputDm,0], [$inputCoC,0.01]];
	for (var i in textInputs) {
		zeroFailure(textInputs[i][0], textInputs[i][1]);
		//Event listener when input is blank
		//textInputs[i].size = "6";
	}
	
	var $plusMinus = $(".plus-minus");
	//Stop it from tabbing
	for (var i = 0; i < $plusMinus.length; i++) {
		$plusMinus[i].tabIndex = "-1";
	}
	
	$(document.body)[0].style.opacity = 1; //Make it visible
});

var cookiesName;
function setCookies(names, values){
	if (names.length != values.length) {
		throw new RangeError("num names != num values");
	}
	for (var i = 0; i < names.length; i++) {
		Cookies.set(names[i], values[i], {expires:7});
	}
}
function getCookies() {
	var coc = parseFloat(Cookies.get(cookiesName[0]));
	var cocType = Cookies.get(cookiesName[1]);
	if (isNumberDefined(coc) && cocType != undefined) {
		$("#sensor").val(cocType);
		$("#sensor").attr("data-coc",coc);
		$("#CoC").attr("value", coc);
	}
	var fNum = parseFloat(Cookies.get(cookiesName[2]));
	if (isNumberDefined(fNum)) {
		updateValues(fNum, $inputF, $sliderF,false);
	}
	var focalLen = parseFloat(Cookies.get(cookiesName[3]));
	if (isNumberDefined(focalLen)) {
		updateValues(focalLen, $inputM, $sliderM,false);
	}
	var dist = parseFloat(Cookies.get(cookiesName[4]));
	if (isNumberDefined(dist)) {
		updateValuesDist(dist);
	}
}

function isNumberDefined(num) {
	return (num != undefined && !isNaN(num));
	
}
function mmCentiMeter(number) {
	//debugger;
	//number in mm
	
	if (number == Number.POSITIVE_INFINITY) {
		return "\u221e"; //Infinity symbol
	}
	//roundSigFig does not work well with infinity
	else if (number == 0) {
		return "0";
	}
	else if (number < 0) {
		//Negative Number
		return "~0";
	}
	number = roundSigFig(number,3,0); //Round now to stop different units but same value. e.g. 10mm, 1cm
	
	if (number < 1) {
		return number * 1000 + "μm";
	}
	else if (number < 10) {
		return number        + "mm";
	}
	else if (number < 1000) {
		return number /   10 + "cm";
	}
	else if (number < 1000000) {
		//Up to 1km
		return number / 1000 + "m";
	}
	else if (number < 10000000000000) {
		return "~\u221e"; //Very, very, large
	}
	
	else {
		return "¯\\_(ツ)_/¯";
	}
}
function calculateAll() {
	var coc = parseFloat($sensorSizeChosen.attr("data-coc"));
	
	var focalLength = parseInt($inputM.val(),10);//$sliderM.data("from");
	var aperture = parseFloat($inputF.val());
	var focusDistance = distanceToFloat($inputDm, $inputDcm) * 1000; //m to mm
	
	setCookies(cookiesName, [coc, $sensorSizeChosen.val(), aperture, focalLength, focusDistance/1000]);
	var closeFocus = nearFocus(focalLength, aperture, coc, focusDistance);
	var furtherFocus   =  farFocus(focalLength, aperture, coc, focusDistance);
	var hyperFocalDistance = mmCentiMeter(hyperfocal(focalLength, aperture, coc));
	var depthField = mmCentiMeter(furtherFocus - closeFocus);//depthOfField(focalLength, aperture, coc, focusDistance);
	
	//Sometimes, near focus can be greater than far focus
	if (closeFocus >= furtherFocus) {
		closeFocus = "~" + mmCentiMeter((closeFocus + furtherFocus)/2); //Get mean, and add a ~ to show it is approximate
		furtherFocus = closeFocus;
	}
	else {
		closeFocus = mmCentiMeter(closeFocus);
		furtherFocus = mmCentiMeter(furtherFocus);
	}
	
	$("#close").text(closeFocus);
	$("#far").text(furtherFocus);
	$("#hyper").text(hyperFocalDistance);
	$("#DoF").text(depthField);
}
var sensorSizes = {
	ff: [36,24],
	apsC: [23.6,15.7],
	apsCC: [22.2,14.8],
	four3: [17.3,13]
};

var textInputs = []; //Array of text inputs

var $sensorSizeChosen = $("#sensor");
var $inputCoC = $("#CoC");

	
	
function cocBlank() {
	//If blank value
	if (isNaN(parseFloat($inputCoC.val()))) {
		if ($sensorSizeChosen.val() == "Manual") {
			$sensorSizeChosen.val("apsCC");
			//Set to aps-c Canon
		}
		var coc = roundSigFig(calculateCoC(sensorSizes.apsCC),6,0);
		//Set input val and data-coc
		$inputCoC.val(coc);
		$sensorSizeChosen.attr("data-coc", coc); //Set to default value
	}

}
function cocListener() {
	//When text input changes, change the calculated CoC
	cocBlank();
	
	if ($sensorSizeChosen.val() != "manual") {
		var coc = roundSigFig(calculateCoC(sensorSizes[$sensorSizeChosen.val()]),6,0);
		$inputCoC.val(coc);
		$sensorSizeChosen.attr("data-coc", coc); //Set the coc in data
	}
	calculateAll();
}
	
$inputCoC.on("change keyup paste", function() {
	if ($sensorSizeChosen.val() != "manual") {
		$sensorSizeChosen.val("manual");
	}
	var value = parseFloat($inputCoC.val());
	if (isNaN(value)) {
		value = 0.01;
		$inputCoC.val(value);
	}
	//value = (value == "")? roundSigFig(calculateCoC(sensorSizes[$sensorSizeChosen.val()]),6,0): value; //If equal to blank, set to 
	$sensorSizeChosen.attr("data-coc", $inputCoC.val());
	calculateAll();
});

	
function updateValues(number,input,slider, update) {
	if (update == undefined) {
		update == true;
	}
	number = parseFloat(number);
	if (input.val() != number) {
		input.val(number); //Hopefully, won't remove a "." in 1. 
	}
	var instance = slider.data("ionRangeSlider");
	instance.update( {
		from: number
	});
	if (update) {
		calculateAll();
	}
}

	function updateValuesDist(value) {
	value = parseFloat(value);
	var meters = distanceToArr(value)[0];
	var centi = distanceToArr(value)[1];
	$inputDm.val(meters);
	$inputDcm.val(centi);
	
	var instance = $sliderD.data("ionRangeSlider");
	instance.update( {
		from: value
	});
	calculateAll();
	
}
	
function zeroFailure(element, value) {
	//adds default/minimum value when element is blank
	element.on("change", function() {
		if (element.val() == "") {
			element.val(value);
		}
		calculateAll();
	});
}

//Aperture/F number
var fNumbers = [.95, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32];//Array of common f numbers
	
var $sliderF = $("#slider-f"),
	$inputF = $("#input-f"),
	$minusF = $("#minus-f"),
	$plusF = $("#plus-f");
	
	
$sliderF.ionRangeSlider({
	type: "single",
	grid: false,
	step: 0.1,
	from: $inputF.prop("value"),
	min: 1,
	max: 40,
	prefix: "f/",
	hideMinMax: true,
	onChange: function (data) {
		$inputF.val(data.from);
		//Not using updateFValues as it requires the slider instance which is made after this function ends
		$("#slider-f").data("from",data.from);
		calculateAll();
	}
});

$minusF.click(function() {
	var newNumber = nearestFNumber(fNumbers, $inputF.prop("value"), false);
	updateValues(newNumber, $inputF, $sliderF);
});

$plusF.click(function() {
	var newNumber = nearestFNumber(fNumbers, $inputF.prop("value"), true);
	updateValues(newNumber, $inputF, $sliderF);
});

$inputF.on("input", function() {
	var value = $(this).prop("value");
	updateValues(value, $inputF, $sliderF);

});
	
//Focal Length: mm
var $sliderM = $("#slider-mm"),
	$inputM = $("#input-mm"),
	$minusM = $("#minus-mm"),
	$plusM = $("#plus-mm");
$sliderM.ionRangeSlider({
	type: "single",
	grid: false,
	step: 1,
	from: $inputM.prop("value"),
	min: 5,
	max: 400,
	postfix: "mm",
	hideMinMax: true,
	onChange: function (data) {
		$inputM.val(data.from);
		calculateAll();
	}
});
$minusM.click(function() {
	var value = parseInt($inputM.prop("value"),10);
	updateValues(value - 1, $inputM, $sliderM);
});

$plusM.click(function() {
	var value = parseInt($inputM.prop("value"),10);
	updateValues(value + 1, $inputM, $sliderM);
});

$inputM.on("input", function() {
	var value = parseInt($(this).val(),10);
	updateValues(value, $inputM, $sliderM);
});
	

//Distance: Meters and Centimeters
var $sliderD = $("#slider-d"),
	$inputDm = $("#input-d-m"),
	$minusDm = $("#minus-d-m"),
	$plusDm = $("#plus-d-m"),
	$inputDcm = $("#input-d-c"),
	$minusDcm = $("#minus-d-c"),
	$plusDcm = $("#plus-d-c");
	

$sliderD.ionRangeSlider({
	type: "single",
	grid: false,
	step: 0.01,
	from: distanceToFloat($inputDm, $inputDcm),
	min: 0.01,
	max: 200,
	postfix: "m",
	hideMinMax: true,
	onChange: function (data) {
		var meters = distanceToArr(data.from)[0];
		$inputDm.val(meters);
		var centi = distanceToArr(data.from)[1];
		
		if (isNaN(centi) || centi == "") {
			centi = 0;
		}
		centi = Math.ceil(centi);
		$inputDcm.val(centi);
		calculateAll();
	}
});
function addSubtractDistance(meter,centi,add,isMeter) {
	var meterValue = parseInt(meter.prop("value"),10);
	meterValue = (isNaN(meterValue))?0:meterValue; //Make equal 0 if value is NaN
	var centiValue = parseInt(centi.prop("value"),10);
	centiValue = (isNaN(centiValue))?1:centiValue; //Make equal 1 if value is NaN
	centiValue %= 100; //Make sure it is not over 99
	if (add && isMeter) {
		meterValue++;
	}
	else if (add && !isMeter) {
		centiValue++;
	}
	else if (!add && isMeter && meterValue > 0) {
		meterValue--;
	}
	else if (!add && !isMeter) {
		centiValue--;
		centiValue = (centiValue < 0)?100+centiValue:centiValue; //Goes from -ve to 100 - number to get something like 99
	}
	centiValue %= 100; //Below 100. Loop back from 100 to 0
	updateValuesDist(meterValue + centiValue/100);

}
	
function loopHundred(num) {
	//Goes from above 100 to below, and below 0 to 100-x
	//-1 can sometimes come up,
	return (100+num%100)%100;
}
	
function distanceToFloat(meter,centi) {
	//From m + cm to a single number
	var meterNumber = meter;
	var centiNumber = centi; //At this stage, doesn't matter if int or obj
	if (typeof(meter) == "object") {
		meterNumber = parseInt(meter.prop("value"),10);
		centiNumber = parseInt(centi.prop("value"),10);//Now a int
	}
	//Only comes here if meter is a string
	meterNumber = (isNaN(meterNumber))?0:meterNumber;
	if (isNaN(centiNumber)) {
		if (meterNumber) {
			//if not 0
			centiNumber = 0;
		}
		else {
			//if 0
			centiNumber = 1;
		}
	}
	if (!meterNumber && !centiNumber) {
		//if both are 0. i.e. centi=0, meter then = 0
		centiNumber = 1;
	}
	//Reduce to below 100 by removing the last digits
	while (centiNumber >= 100) {
		centiNumber = Math.floor(centiNumber/10);
	}
	//centiNumber %= 100;//Reduce to below 100
	return meterNumber + centiNumber/100;
}
	
	
function distanceToArr(float) {
	if (isNaN(float)) {
		float = 0.01; //If it is NaN, make it a number 
	}
	if (typeof(float) == "object") {
		float = float.val();
	}
	var meter = Math.floor(float);
	var centi = Math.round((float - meter)*100);
	return [meter,centi];
}
	
	
$minusDm.click(function() {
	addSubtractDistance($inputDm, $inputDcm, false, true);
});
$plusDm.click(function() {
	addSubtractDistance($inputDm, $inputDcm, true, true);
});

$minusDcm.click(function() {
	addSubtractDistance($inputDm, $inputDcm, false, false);
});
$plusDcm.click(function() {
	addSubtractDistance($inputDm, $inputDcm, true, false);
});



$inputDm.on("input", function() {
	//var value = $(this).prop("value") + $inputDcm.prop("value")/100;
	updateValuesDist(distanceToFloat($inputDm, $inputDcm));
});
$inputDcm.on("input", function() {
//	var value = $(this).prop("value") + $inputDcm.prop("value")/100;
//	updateValuesDist(value);
	updateValuesDist(distanceToFloat($inputDm, $inputDcm));
});
