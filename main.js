function hyperfocal(focalLength, fNumber, circleConfusion) {
return focalLength + (focalLength * focalLength)/(fNumber * circleConfusion);//May need to remove focalLength + . Some don't use this
//	//Hyper Focal distance = (The focal length of your lens in millimeters x 2) / (Aperture x Circle of Confusion in millimeters).
//	
	
//	return (focalLength * focalLength)/(fNumber * circleConfusion);
}

//https://en.wikipedia.org/wiki/Depth_of_field#Near:far_DOF_ratio
//N: f number
//f: focal length
//s: focus distance
//c: circle of confusion
//
//near:
//(Ncs(s-f))/(f*f +Nc(s-f));
//far:
//(Ncs(s-f))/(f*f-Nc(s-f));



function nearFocus(focalLength, fNumber, circleConfusion, focusDistance) {
	var hyperfocalDistance = hyperfocal(focalLength, fNumber, circleConfusion);
//	if (hyperfocalDistance <= focusDistance) {
//		//If the focus distance is greater than the hyperfocal distance, near focus is 1/2 hyperfocal
//		return hyperfocalDistance / 2;
//	}
//	else { 
		var close = hyperfocalDistance * focusDistance;
		close /= hyperfocalDistance + (focusDistance - focalLength);
		return close;
//		return (hyperfocalDistance * focusDistance)/(hyperfocalDistance + (focusDistance - focalLength));
		//Return the result regardless or not of if focus distance > hyperfocal
		
//		return (fNumber * circleConfusion * focusDistance * (focusDistance - focalLength))/(focalLength * focalLength + fNumber * circleConfusion * (focusDistance - focalLength));
//	}
}


function farFocus(focalLength, fNumber, circleConfusion, focusDistance) {
	var hyperfocalDistance = hyperfocal(focalLength, fNumber, circleConfusion);
		if (hyperfocalDistance <= focusDistance) {
		//If the focus distance is greater than the hyperfocal distance, far focus is infinity
		return Number.POSITIVE_INFINITY;
	}
	else {
		var far = hyperfocalDistance * focusDistance;
		far /= hyperfocalDistance - (focusDistance - focalLength);
		return far;
		//return (hyperfocalDistance * focusDistance)/(hyperfocalDistance - (focusDistance - focalLength));
//		return (fNumber * circleConfusion * focusDistance * (focusDistance - focalLength))/(focalLength * focalLength - fNumber * circleConfusion * (focusDistance - focalLength));
	}
}

function depthOfField(focalLength, fNumber, circleConfusion, focusDistance) {
	return farFocus(focalLength, fNumber, circleConfusion, focusDistance) - nearFocus(focalLength, fNumber, circleConfusion, focusDistance);
}

function calculateCoC(arrayDimen, denominator) {
	var width = arrayDimen[0];
	var height = arrayDimen[1];
	if (denominator == undefined) {
		denominator = 1500; //Ziess Formula
	}
	return Math.sqrt((height * height) + (width * width)) / denominator;
}
//
//var mm = 50;
//var f = 2.8;
//var coc = 0.019948;
//var distance = 44809.23114383111;
//
//depthOfField(mm, f, coc, distance);







//UI

function getBiggerFNumber(number) {
	//Finds a f number bigger than number
	//Uses half stop system
	var full = 2;
	var half = 1.4;
	var iterations = 6;
	for (var i = 0; i <= iterations; i++) {
		if (half * Math.pow(2, i) > number) {
			//Doubles every time (half * 1, half*2, half * 4...)
			//If that is bigger, return
			return roundSigFig(half * Math.pow(2,i),2,0);
		}
		//Repeat for full stops
		if (full * Math.pow(2, i) > number) {
			return roundSigFig(full * Math.pow(2,i),2,0);
		}
	}
	return number;//If you get here, it is way too big
}
	

function roundSigFig(number, sigFig, kind) {
	//number: number
	//Number of significant figures
	//Kind: -1=floor. 0=round. 1 = ceil
	
	//Infinity and 0 creates an infinite loop
	if (number == Number.POSITIVE_INFINITY || number == Number.NEGATIVE_INFINITY || number == 0) {
		return number;
	}
	
	var isNegative = number < 0; //Bool. True if less than zero
	if (isNegative) {
		number *= -1; //Make it positive
	}
	var counter = 0; //Counts the number of iterations for later
	
	while (number < Math.pow(10, sigFig - 1)) {
		//while smaller than number of significant figures
		number *= 10; //Multiply by 10
		counter++;
	}
	if (kind == -1) {
		number = Math.floor(number);
	}
	else if (kind == 0) {
		number = Math.round(number);
	}
	else if (kind == 1) {
		number = Math.ceil(number);
	}
	
	if (isNegative) {
		number *= -1; //Make it negative again
	}
	
	return number / Math.pow(10, counter);
	//Divides after the multiplication
}
	
function nearestFNumber(arrayF, value, up) {
	//Function returning the nearest (up or down) value in an array to a given number
	//up = true. down = false
	value = parseFloat(value);
	var array = arrayF.slice(0); //Make a new array so that the original object is not effected
	array = array.sort(function(a,b) {
		return a-b;
	});
	//Sort Array
	//Remove value from the array if found
	if (array.indexOf(value) > -1) {
		array.splice(array.indexOf(value),1);
	}
	//Sort array
	if (up) {
		//Find the one above it
		for (var i = 0; i < array.length; i++) {
			if (value < array[i]) {
				//array[i] is bigger
				return array[i];
			}
		}
		return getBiggerFNumber(value);
		//If it can't find a bigger one, make a new one
	}
	
	else {
		for (var i = array.length - 1; i >= 0; i--) {
			if (array[i] < value) {
				//if value is bigger than the array
				return array[i];
			}
		}
		return value;
		//Way to small. Return itself
	}
}
	