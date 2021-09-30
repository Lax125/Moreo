const O = 0, RE = 1;
const O_DIAMETER = 18;
const RE_DIAMETER = 16;
const O_FILL = "rgb(89,68,59)";
const O_STROKE = "rgb(45,34,30)";
const RE_FILL = "rgb(233,229,210)";
const RE_STROKE = "rgb(117,115,105)";

// Thickness of each disc is 1.0, both in physics and drawing
// For that reason, scale() must be done before drawing the discs
const DISC_STROKEWEIGHT = 0.30;

const oreoState = {
  groundedDiscs: {
    y: 5,
    dy: 0,
    discTypes: [O, RE, O], // This is bloody genius i swear on me mum
  },
  fallingDiscs: [{ y: -5, dy: 0, discType: O }, { y: -7, dy: 0, discType: RE }],
  flungDiscs: [{ x: 10, z: 10, dx: 0, dz: 0, discType: O }],
};

function setup() {
  // add your setup code here
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  // add your draw code here
  background(255);
  push();
  translate(width / 2, height / 2);
  scale(10);
  drawOreoState(mouseY * 90/height);
  pop();
}

function updateOreoState() {
  // TODO
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
      fillColor = color(O_FILL);
      strokeColor = color(O_STROKE);
      break;
    default:
      discDiameter = RE_DIAMETER;
      fillColor = color(RE_FILL);
      strokeColor = color(RE_STROKE);
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
  // TODO
}

// when you hit the spacebar, what's currently on the canvas will be saved (as a
// "thumbnail.png" file) to your downloads folder
function keyTyped() {
  if (key === " ") {
    saveCanvas("thumbnail.png");
  }
}
