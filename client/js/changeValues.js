document.getElementById("OV_FP_FT1").setAttribute("stroke", "green");

function startLoop() {
	var i;
	var x = 100;
	var j = 2;
	var increasing = true;
	console.log(document.getElementById("PS_FP_FT1_Text"));
	setInterval(function(){
			if (increasing) {
			j += 1;
			} else {
				j -= 1;
			}
			if (j > 99 || j < 2) {
				increasing = !increasing;
			}
			document.getElementById("OV_FP_FT1").setAttribute("stroke-width", (j/10).toString());
			document.getElementById("PS_FP_FT1_Text").innerHTML = j;
		}, 10);
		
	
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
