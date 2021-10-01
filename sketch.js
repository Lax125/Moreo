const O = 0, RE = 1;

// Display constants
const OREO_CONSTRUCTION_ROTATION = 15;
const BACKGROUND_COLOR = "rgb(46,98,174)";

// Disc drawing constants
const O_DIAMETER = 18;
const RE_DIAMETER = 16;
const O_FILL = "rgb(89,68,59)";
const O_STROKE = "rgb(45,34,30)";
const RE_FILL = "rgb(233,229,210)";
const RE_STROKE = "rgb(117,115,105)";
const DISC_STROKEWEIGHT = 0.30;

// Glass drawing constants
const MILK_FILL = "rgb(252,253,250)";
const MILK_STROKE = "rgb(126, 127, 125)";
const GLASS_FILL = "rgba(255, 255, 255, 0.1)";
const GLASS_STROKE = "rgb(20, 20, 20)";
const GLASS_STROKEWEIGHT = 0.50;

// Disc physics constants
const GRAVITY = 10;
const AIR_RESISTANCE = 1;
const GROUND_RESISTANCE = 7;
const GROUND_TENSION = 0.2;
const PHYSICS_FRAMERATE = 60;
const INITIAL_FALLING_SPEED = 10;
const FLING_DX = 1.9;
const FLING_DZ = -5;

// Animation constants
const ROTATION_FRAMES = 60;
const FLING_PERIOD_FRAMES = 10;

const oreoState = {
  groundedDiscs: {
    y: 0,
    dy: 0,
    discTypes: [O],
  },
  fallingDiscs: [],
  flungDiscs: [],
  dunkedDiscs: [],
};

let sketchState = "CONSTRUCTING_OREO";
let sceneScale;
let Osound, REsound;
let oreoWordFont;

function preload() {
  Osound = loadSound("assets/kick.mp3");
  REsound = loadSound("assets/snare.mp3");
  oreoWordFont = loadFont("assets/Kanit-Black.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  sceneScale = width/100;
}

function draw() {
  updateOreoState();

  push();
  background(BACKGROUND_COLOR);

  if (sketchState === "FLINGING_OREO") {
    drawOreoWord();
  }

  let oreoRotation;
  if (sketchState === "CONSTRUCTING_OREO") {
    oreoRotation = OREO_CONSTRUCTION_ROTATION;
    translate(width/2, height/2);
  } else if (sketchState === "ROTATING_OREO") {
    const animationFrameNo = frameCount - animationFrame0;
    const animationProgress = constrain(map(animationFrameNo, 0, ROTATION_FRAMES, 0, 1), 0, 1);
    const transitionProgress = sin(90*animationProgress);
    oreoRotation = OREO_CONSTRUCTION_ROTATION + transitionProgress*(90 - OREO_CONSTRUCTION_ROTATION);
    if (animationFrameNo > ROTATION_FRAMES) {
      startFlingingAnimation();
    }
    translate(
      map(transitionProgress, 0, 1, width/2, 0.7*O_DIAMETER*sceneScale),
      map(transitionProgress, 0, 1, height/2, height - 0.7*O_DIAMETER*sceneScale)
    );
  } else {
    oreoRotation = 90;
    translate(0.7*O_DIAMETER*sceneScale, height - 0.7*O_DIAMETER*sceneScale);
    if ((frameCount - animationFrame0) % FLING_PERIOD_FRAMES === 0) {
      flingNextDisc();
    }
  }
  scale(sceneScale);
  drawOreoState(oreoRotation);
  pop();

  // Draw glass of milk
  push();
  let glassAnimationProgress;
  if (sketchState == "CONSTRUCTING_OREO") {
    glassAnimationProgress = 0;
  }
  else if (sketchState === "ROTATING_OREO") {
    const animationFrameNo = frameCount - animationFrame0;
    glassAnimationProgress = constrain(map(animationFrameNo, 0, ROTATION_FRAMES, 0, 1), 0, 1);
  }
  else {
    glassAnimationProgress = 1;
  }
  glassTransitionProgress = sin(90*glassAnimationProgress);

  const glassY = map(glassTransitionProgress, 0, 1, height + O_DIAMETER*sceneScale, height - 0.1*O_DIAMETER*sceneScale);
  translate(width - O_DIAMETER*sceneScale, glassY);
  scale(sceneScale);
  drawGlass();
  pop();

  if (getAudioContext().state === "suspended") {
    drawSoundInstructions();
  }
}

function updateOreoState() {
  if (sketchState === "CONSTRUCTING_OREO") {
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
        playDisc(lowestFallingDisc.discType);
      }
    }
    if (oreoState.groundedDiscs.discTypes.length > 0) {
      const groundedDistFromNeutral = oreoState.groundedDiscs.y - (oreoState.groundedDiscs.discTypes.length - 1)/2;
      oreoState.groundedDiscs.dy -= GROUND_TENSION*groundedDistFromNeutral/PHYSICS_FRAMERATE;
      oreoState.groundedDiscs.dy *= 1 - GROUND_RESISTANCE/PHYSICS_FRAMERATE;
      oreoState.groundedDiscs.y += oreoState.groundedDiscs.dy;
    }
  }
  else if (sketchState == "FLINGING_OREO" && oreoState.flungDiscs.length > 0) {
    for (disc of oreoState.flungDiscs) {
      disc.dz += GRAVITY/PHYSICS_FRAMERATE;
      disc.dx *= 1 - AIR_RESISTANCE/PHYSICS_FRAMERATE;
      disc.dy *= 1 - AIR_RESISTANCE/PHYSICS_FRAMERATE;
      disc.x += disc.dx;
      disc.z += disc.dz;
    }
    if (oreoState.flungDiscs[0].z > 0) {
      playDisc(oreoState.flungDiscs[0].discType);
      oreoState.dunkedDiscs.push(oreoState.flungDiscs[0].discType);
      oreoState.flungDiscs = oreoState.flungDiscs.slice(1);
    }
  }
}

function drawOreoState(rotation) {
  oreoState.groundedDiscs.discTypes.forEach((discType, i) => {
    drawDisc(discType, 0, oreoState.groundedDiscs.y - i, 0, rotation);
  });

  oreoState.fallingDiscs.forEach((disc) => {
    drawDisc(disc.discType, 0, disc.y, 0, rotation);
  });

  for (let i = oreoState.flungDiscs.length - 1; i >= 0; i--) {
    const disc = oreoState.flungDiscs[i];
    drawDisc(disc.discType, disc.x, 0, disc.z, rotation);
  }
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

function drawGlass() {
  const glassBottomRadius = O_DIAMETER * 0.6;
  const glassTopRadius = O_DIAMETER * 0.7;
  const glassHeight = O_DIAMETER * 1.75;
  const milkLevel = 0.75;

  push();
  strokeWeight(GLASS_STROKEWEIGHT);

  fill(MILK_FILL);
  stroke(MILK_STROKE);
  beginShape();
  vertex(-map(milkLevel, 0, 1, glassBottomRadius, glassTopRadius), -milkLevel*glassHeight);
  vertex(map(milkLevel, 0, 1, glassBottomRadius, glassTopRadius), -milkLevel*glassHeight);
  vertex(glassBottomRadius, 0);
  vertex(-glassBottomRadius, 0);
  endShape(CLOSE);  

  fill(GLASS_FILL);
  stroke(GLASS_STROKE);
  beginShape();
  vertex(-glassTopRadius, -glassHeight);
  vertex(glassTopRadius, -glassHeight);
  vertex(glassBottomRadius, 0);
  vertex(-glassBottomRadius, 0);
  endShape(CLOSE);  

  pop();
}

function drawOreoWord() {
  push();
  textAlign(CENTER, CENTER);
  textWrap(CHAR);
  textFont(oreoWordFont);
  fill(255);
  stroke(23,49,86);
  textSize(width/15);
  strokeWeight(width/100);
  lines = [""];
  for (syllable of oreoState.dunkedDiscs.map(dt => dt == O ? "O" : "RE")) {
    if (textWidth(lines[lines.length - 1]) >= 0.7 * width) {
      lines.push("");
    }
    lines[lines.length - 1] += syllable; 
  }
  text(lines.join("\n"), width/2, height/2);
  pop();
}

// Draw overlay telling user to click in order to resume audio context
function drawSoundInstructions() {
  push();
  background(0, 200);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(24);
  text("Click anywhere to continue.", width/2, height/2);
  pop();
}

function playDisc(discType) {
  switch(discType) {
    case O:
      Osound.play();
      break;
    default:
      REsound.play();
  }
}

function flingNextDisc() {
  if (oreoState.groundedDiscs.discTypes.length == 0) return;
  oreoState.flungDiscs.push({
    x: 0,
    z: 0,
    dx: FLING_DX,
    dz: FLING_DZ,
    discType: oreoState.groundedDiscs.discTypes.pop(),
  });
}

function spawnDisc(discType) {
  oreoState.fallingDiscs.push({
    // attempt to spawn immediately off-screen
    y: max(((-height/2)/sceneScale - 3)/cos(OREO_CONSTRUCTION_ROTATION), -200), 
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
  oreoState.dunkedDiscs = [];
}

function startRotationAnimation() {
  for (disc of oreoState.fallingDiscs) {
    oreoState.groundedDiscs.discTypes.push(disc.discType);
    oreoState.groundedDiscs.y = 0;
  }
  oreoState.fallingDiscs = [];
  sketchState = "ROTATING_OREO";
  animationFrame0 = frameCount + 1;
}

function startFlingingAnimation() {
  sketchState = "FLINGING_OREO";
  animationFrame0 = frameCount + 1;
}

function resetSketch() {
  clearOreoState();
  sketchState = "CONSTRUCTING_OREO";
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
  else if (key === "s") {
    startRotationAnimation();
  }
  else if (key === "f") {
    sketchState = "FLINGING_OREO";
    flingNextDisc();
  }
  else if (key === "r") {
    resetSketch();
  }
}

function mousePressed() {
  if (getAudioContext().state !== "running") {
    getAudioContext().resume();
  }

  return false;
}
