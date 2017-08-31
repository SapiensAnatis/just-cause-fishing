"use strict"; // 1v1 me in melee final destination fox only no items

// ----- Global variables -----
var pos = 5;

// Physics constants
// The value of the bobber object's bottom margin when at the minimum point
var rectHeight = null;
function getRectHeight() {
	rectHeight = window.innerHeight * 0.6
	// Called on resolution change
}

getRectHeight();


// In m.s^-2, the amount the velocity of the bobber changes per second without human intervention
const gravityStrength = -9.81 * 80;
// The multiplier used to invert the velocity of the bobber when it bounces off of an edge
const bounciness = -0.6;
// The 'power' of the mouse click represented as an acceleration
const mouseStrength = 9.81 * 80;
// Clamps
const maxVelocity = 500;
const minVelocity = -500;
// Minimum speed (absolute value of velocity) required to bounce. Prevents the bobber from bouncing in small amounts infinitely at the bottom,
// or 'jittering'
const minSpeedBounce = 100;

// Time constants
// Tick rate in milliseconds, used for polling mouse and applying acceleration/velocity
const majorTickRate = 80;
// Tick rate in ms used for recalculating position and redrawing bobber
const minorTickRate = 20;

// Misc constants
// Pixel tolerance for the bobber being considered 'near' the bottom or top
const nearConstant = 50;

// ----- Bobber class definition -----
class Bobber {
	constructor(obj) {
		// Initialize from parameters
		this.obj = obj;
		
		// Initialize other fields
		this._position = 20;
		this.velocity = 0.1;
		this.acceleration = 0;
		// Bounce cooldown
		this.lastbounce = null;
		// Stuck variables
		this.idleAtBottom = false;
		this.idleAtTop = false;
	}

	// Position is the number of pixels above the lower bound, not the style data
	// It does not represent anything real or make any drawcalls
	get position() {
		// Backing field to prevent recursion
		return this._position;
	}	

	bounce() {
		// Stick to bottom
		if (Math.abs(this.velocity) < minSpeedBounce) {
			if (this.isNearBottom) { this.stickBottom(); }
			else if (this.isNearTop) { this.stickTop(); }
			return;
		}
		// Invert velocity appropriately
		this.velocity *= bounciness;
	}

	set position(newPos) {
		// Used to update position regularly based on velocity. Causes bouncing

		// Bounce detection:
		// If we move into an edge, clamp the position and change velocities appropriately
		if (newPos > rectHeight) {
			newPos = rectHeight;
			this.bounce();
		}

		if (newPos < 0) {
			newPos = 0;
			this.bounce();
		}

		// Update position
		this._position = newPos
	}

	get velocity() {
		return this._velocity;
	}

	set velocity(newVelocity) {
		if (newVelocity > maxVelocity) {
			this._velocity = maxVelocity;
		} else if (newVelocity < minVelocity) {
			this._velocity = minVelocity;
		} else {
			this._velocity = newVelocity;
		}
	}

	// Delta (change) funcs
	// ds = change in position (velocity)
	// dv = change in velocity (acceleration)


	get dsPerTick() {
		return this.velocity * (minorTickRate / 1000)
	}

	get dvPerTick() {
		return this.acceleration * (majorTickRate / 1000)
	}

	// Check if near bottom/top for sticking funcs
	get isNearTop() {
		return ((rectHeight - this.position) < nearConstant);
	}
	
	get isNearBottom() {
		return (this.position < nearConstant);
	}

	stickBottom() {
		// Stick to bottom to prevent infinite bounce
		this.acceleration = 0;
		this.velocity = 0;
		this.idleAtBottom = true;
	}
	
	stickTop() {
		this.acceleration = 0;
		this.velocity = 0;
		this.idleAtTop = true;
	}
}

// ----- Application logic -----

// Initialization
var bobber = null;
var positionLabel = null;
var velocityLabel = null;
var accelerationLabel = null;
var mainDiv = null;

var visible = false;


function init() {
	// Grab elements on load
	var bobberObj = document.getElementById('bobber-rect');
	bobber = new Bobber(bobberObj);
	// Subscribe events
	var ticks = setInterval("tick()", majorTickRate);
	var ticks = setInterval("microtick()", minorTickRate);
}

// Mouse functions (keeping track of if a mouse button is down or not)
var mouseDown = 0;
window.onmousedown = function() {
	++mouseDown;
}

window.onmouseup = function() {
	--mouseDown;
}

// Update functions
function drawBobber() {
	// Since we're working with the y property - the number of pixels /down/, we need to invert our position
	var projectedPosition = rectHeight - bobber.position
	// Need to account for the bobber's initial offset too, to make it fit inside the ocean rect
	projectedPosition +=  + 0.0255 * window.innerHeight;
	bobber.obj.setAttribute("y", projectedPosition+"px")
}

function tick() {
	/* console.log("mouseDown: ", mouseDown);
	console.log("bobber.idleAtBottom: ", bobber.idleAtBottom);
	console.log("bobber.idleAtTop: ", bobber.idleAtTop);
	console.log("bobber.isNearTop: ", bobber.isNearTop)1; */

	// Calculate acceleration based on whether mouse is held
	
	if (bobber.idleAtBottom) {
		if (mouseDown) {
			bobber.acceleration = mouseStrength;
			bobber.idleAtBottom = false;
		}
	} else if (bobber.idleAtTop) {
		if (!mouseDown) {
			bobber.acceleration = gravityStrength;
			bobber.idleAtTop = false;
		}
	} else {
		if (mouseDown) {
			bobber.acceleration = mouseStrength;
		} else {
			bobber.acceleration = gravityStrength;
		}
	}
	
	// Apply acceleration values to velocity, and then velocity values to position
	bobber.velocity += bobber.dvPerTick;

}

function microtick() {
	// Redraw func
	bobber.position += bobber.dsPerTick;
	drawBobber();
}



			
// ----- UI logic
/* window.onkeypress = function(e) {
	var keycharPressed = String.fromCharCode(e.which)
	alert("You pressed: ", e.which);
	if (keycharPressed == "f") {
		visible = !visible;
		// Update visibility accordingly
		if (visible) {
			mainDiv.style.visibility = "visible";
		} else {
			mainDiv.style.visibility = "hidden";
		}
	}
} */
