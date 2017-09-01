"use strict"; // 1v1 me in melee final destination fox only no items

// ----- Global variables -----
var pos = 5;

// Physics constants
// The value of the bobber object's bottom margin when at the minimum point
var rectHeight = null;

// Okay, I lied, this one isn't really a constant, but it used to be. It needs to change because if the resolution
// changes, so does the size of the rectangles (the UI is scaled to be proportionate to screen res, so that
// nobody is squinting trying to see it on a 4k monitor)
function getRectHeight() {
	rectHeight = window.innerHeight * 0.6 - 2
	// Called on resolution change. Subtract 2 to maintain borders
}

// The resolution change event, which calls this function, *seems* to be called on load, but just to be sure:
getRectHeight();


// In m.s^-2, the amount the velocity of the bobber changes per second without human intervention
const gravityStrength = -9.81 * 80;
// The multiplier used to invert the velocity of the bobber when it bounces off of an edge
const bounciness = -0.6;
// The 'power' of the mouse click represented as an acceleration
const mouseStrength = 9.81 * 80;

// Clamps
// The maximum speed (absolute velocity) the bobber can reach. Because we use acceleration, holding the mouse for
// too long could result in the bobber reaching stupid speeds which are hard to control. 
const maxSpeed = 500;
// Minimum speed (absolute value of velocity) required to bounce. Prevents the bobber from bouncing in small 
// amounts infinitely at the bottom, i.e. 'jittering'
const minSpeedBounce = 100;

// Time constants

/*
 * There are two tick-rates here because I found that anything above 34ms (30fps) makes the bobber appear 
 * 'laggy' on the screen.
 * However, such high tick rates for doing everything (mouse polling, calculations, redrawing) 
 * can cause fps lag in the wider game.
 * So I have a tick rate which is for the minimum (recalculating position and drawing) to represent a change; this 
 * one is low enough to make the bobber not animated in a choppy way, and then the rest (calculating velocity 
 * and acceleration) is on a higher tickrate.
 * If FPS issues aren't really there, then you can always put them equal to each other.
 */

// Tick rate in milliseconds, used for polling mouse and applying acceleration/velocity
const majorTickRate = 80;
// Tick rate in ms used for recalculating position and redrawing bobber
const minorTickRate = 20;

// Misc constants
// Pixel tolerance for the bobber being considered 'near' the bottom or top
// You shouldn't need to change this unless users complain that the bobber freezes when it isn't near the bottom
const nearConstant = 10;

// ----- Bobber class definition -----
class Bobber {
	constructor(obj) {
		// Initialize from parameters
		this.obj = obj;
		
		// Initialize other fields
		this._position = 20;
		this.velocity = 0.1;
		this.acceleration = 0;
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
			// If it's not really going anywhere, determine where this is happening & stick accordingly
			this.acceleration = 0;
			this.velocity = 0;

			if (this.isNearBottom) { this.idleAtBottom = true; }
			else if (this.isNearTop) { this.idleAtTop = true; }
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

		// Same if we're moving into the bottom
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
		// Clamp velocity
		// If it's over, the min() will set it to positive max speed (500)
		this._velocity = Math.min(newVelocity, maxSpeed)
		// If it's under, max() will set it to -500
		this._velocity = Math.max(newVelocity, maxSpeed * -1)
	}

	// Check if near bottom/top for sticking funcs
	get isNearTop() {
		return ((rectHeight - this.position) < nearConstant);
	}
	
	get isNearBottom() {
		return (this.position < nearConstant);
	}
}

// ----- Application logic -----

// Initialization
// Declare this here to put it in the global scope, as we need to access it pretty much everywhere
var bobber = null;

function init() {
	// Grab elements on load
	var bobberObj = document.getElementById('bobber-rect');
	bobber = new Bobber(bobberObj);
	// Subscribe events
	var ticks = setInterval("tick()", majorTickRate);
	var ticks = setInterval("microtick()", minorTickRate);
}

// Mouse functions (keeping track of if a mouse button is down or not)
// Kind of sucks but I'm not aware of any better method
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
	projectedPosition += 0.0255 * window.innerHeight;
	// Update y property
	bobber.obj.setAttribute("y", projectedPosition+"px")
}

function tick() {
	/* console.log("mouseDown: ", mouseDown);
	console.log("bobber.idleAtBottom: ", bobber.idleAtBottom);
	console.log("bobber.idleAtTop: ", bobber.idleAtTop);
	console.log("bobber.isNearTop: ", bobber.isNearTop)1; */

	// Calculate acceleration based on whether mouse is held
	
	if (bobber.idleAtBottom) {
		// If stuck at bottom, we're waiting for the user to press their mouse to release
		if (mouseDown) {
			bobber.acceleration = mouseStrength;
			bobber.idleAtBottom = false;
		}
	} else if (bobber.idleAtTop) {
		// Conversely, if stuck at the top, we're waiting for them to let go
		if (!mouseDown) {
			bobber.acceleration = gravityStrength;
			bobber.idleAtTop = false;
		}
	} else {
		// Otherwise do normal behaviour
		if (mouseDown) {
			bobber.acceleration = mouseStrength;
		} else {
			bobber.acceleration = gravityStrength;
		}
	}
	
	// Apply acceleration values to velocity
	bobber.velocity += (bobber.acceleration * (majorTickRate / 1000))

}

function microtick() {
	// Redraw func
	// Recalculate position
	bobber.position += (bobber.velocity * (minorTickRate / 1000))
	// And redraw
	drawBobber();
}