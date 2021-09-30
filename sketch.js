const O = 0, RE = 1;

// Display constants
const OREO_SCALE = 10;
const OREO_CONSTRUCTION_ROTATION = 10;
const BACKGROUND_COLOR = "rgb(46,98,174)";

// Disc drawing constants
const O_DIAMETER = 18;
const RE_DIAMETER = 16;
const O_FILL = "rgb(89,68,59)";
const O_STROKE = "rgb(45,34,30)";
const RE_FILL = "rgb(233,229,210)";
const RE_STROKE = "rgb(117,115,105)";
const DISC_STROKEWEIGHT = 0.30;

// Disc physics constants
const GRAVITY = 10;
const AIR_RESISTANCE = 1;
const GROUND_RESISTANCE = 7;
const GROUND_TENSION = 0.2;
const PHYSICS_FRAMERATE = 60;
const INITIAL_FALLING_SPEED = 10;

const oreoState = {
  groundedDiscs: {
    y: 0,
    dy: 0,
    discTypes: [O],
  },
  fallingDiscs: [],
  flungDiscs: [],
};

let Osound, REsound;

function preload() {
  Osound = loadSound("assets/kick.wav");
  REsound = loadSound("assets/snare.wav");
}

function setup() {
  // add your setup code here
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  // add your draw code here
  background(BACKGROUND_COLOR);

  push();
  translate(width / 2, height / 2);
  scale(OREO_SCALE);
  updateOreoState();
  drawOreoState(OREO_CONSTRUCTION_ROTATION);
  pop();
}

function updateOreoState() {
  // TODO
  const groundedDiscCount = oreoState.groundedDiscs.discTypes.length;
  if (oreoState.fallingDiscs.length > 0) {
    for (disc of oreoState.fallingDiscs) {
      disc.dy += GRAVITY/PHYSICS_FRAMERATE;
      disc.dy *= 1 - AIR_RESISTANCE/PHYSICS_FRAMERATE;
      disc.y += disc.dy;
    }

    const lowestFallingDisc = oreoState.fallingDiscs[0];

    if (lowestFallingDisc.y >= oreoState.groundedDiscs.y - groundedDiscCount) {
      oreoState.groundedDiscs.dy *= groundedDiscCount/(groundedDiscCount + 2);
      oreoState.groundedDiscs.dy += lowestFallingDisc.dy/(groundedDiscCount + 2);
      oreoState.groundedDiscs.discTypes.push(lowestFallingDisc.discType);
      oreoState.fallingDiscs = oreoState.fallingDiscs.slice(1);

      switch(lowestFallingDisc.discType) {
        case O:
          Osound.play();
          break;
        default:
          REsound.play();
      }
    }
  }
  if (oreoState.groundedDiscs.discTypes.length > 0) {
    const groundedDistFromNeutral = oreoState.groundedDiscs.y - (oreoState.groundedDiscs.discTypes.length - 1)/2;
    oreoState.groundedDiscs.dy -= GROUND_TENSION*groundedDistFromNeutral/PHYSICS_FRAMERATE;
    oreoState.groundedDiscs.dy *= 1 - GROUND_RESISTANCE/PHYSICS_FRAMERATE;
    oreoState.groundedDiscs.y += oreoState.groundedDiscs.dy;
  }
}

function drawOreoState(rotation) {
  oreoState.groundedDiscs.discTypes.forEach((discType, i) => {
    drawDisc(discType, 0, oreoState.groundedDiscs.y - i, 0, rotation);
  });

  oreoState.fallingDiscs.forEach((disc) => {
    drawDisc(disc.discType, 0, disc.y, 0, rotation);
  });

  oreoState.flungDiscs.forEach((disc) => {
    drawDisc(disc.discType, disc.x, 0, disc.z, rotation);
  });
}

// Important: ensure scaling is done before calling this,
// as the thickness of each disc is 1 unit (1 logical pixel) by default
function drawDisc(discType, x, y, z, rotation) {
  push();
  ellipseMode(CENTER);
  rectMode(CENTER);
  angleMode(DEGREES);

  let discDiameter, fillColor, strokeColor;
  switch (discType) {
    case O:
      discDiameter = O_DIAMETER;
      fillColor = O_FILL;
      strokeColor = O_STROKE;
      break;
    default:
      discDiameter = RE_DIAMETER;
      fillColor = RE_FILL;
      strokeColor = RE_STROKE;
  }

  translate(x, cos(rotation)*y + sin(rotation)*z);

  if (rotation == 0) {
    strokeWeight(DISC_STROKEWEIGHT);
    fill(fillColor);
    stroke(strokeColor);
    rect(0, 0, discDiameter, 1);
  }
  else if (rotation == 90) {
    strokeWeight(DISC_STROKEWEIGHT);
    fill(fillColor);
    stroke(strokeColor);
    circle(0, 0, discDiameter);
  }
  else {
    // Midsection fill
    fill(fillColor);
    noStroke();
    // +0.2 is used as an epsilon to rid any gaps
    rect(0, 0, discDiameter, cos(rotation)*1.2);

    // Bottom and midsection outline
    strokeWeight(DISC_STROKEWEIGHT);
    stroke(strokeColor);
    arc(0, cos(rotation)*0.5, discDiameter, sin(rotation)*discDiameter, 0, 180);
    line(-discDiameter/2, cos(rotation)*-0.5, -discDiameter/2, cos(rotation)*0.5);
    line(discDiameter/2, cos(rotation)*-0.5, discDiameter/2, cos(rotation)*0.5);

    // Top
    ellipse(0, cos(rotation)*-0.5, discDiameter, sin(rotation)*discDiameter);
  }

  pop();
}

function flingNextDisc() {
  // TODO
}

function spawnDisc(discType) {
  oreoState.fallingDiscs.push({
    // attempt to spawn immediately off-screen
    y: max(((-height/2)/OREO_SCALE - 3)/cos(OREO_CONSTRUCTION_ROTATION), -200), 
    dy: INITIAL_FALLING_SPEED/PHYSICS_FRAMERATE,
    discType: discType,
  });
}

function clearOreoState() {
  oreoState.groundedDiscs = {
    y: 0,
    dy: INITIAL_FALLING_SPEED/PHYSICS_FRAMERATE,
    discTypes: [],
  }
  oreoState.fallingDiscs = [];
  oreoState.flungDiscs = [];
}

// when you hit the spacebar, what's currently on the canvas will be saved (as a
// "thumbnail.png" file) to your downloads folder
function keyTyped() {
  if (key === " ") {
    saveCanvas("thumbnail.png");
  }
  else if (key === ",") {
    spawnDisc(O);
  }
  else if (key === ".") {
    spawnDisc(RE);
  }
  else if (key == "/") {
    clearOreoState();
  }
}

function mousePressed() {
  getAudioContext().resume();
}
