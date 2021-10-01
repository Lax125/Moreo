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
const FLING_PERIOD_FRAMES = 8;
const RESET_FRAMES = 60;

// Other constants
const MAX_DISCS = 30;
const DEMO_OREOS = [
  [O,RE,O],
  [O,RE,O,RE,O],
  [RE,RE,RE,RE,RE],
  [O,O,O,O,O],
  [O,RE,O,O],
  [O,RE,O,RE,RE,RE,O,RE],
  [O,RE,O,RE,O,RE],
  [RE,RE,O],
  [RE,O,RE],
  [O,RE,RE,RE,RE,RE,RE,RE,RE,O],
  [O,O,O,RE,RE,RE,RE,RE,RE,O,O,O],
  [O,RE,RE,RE,RE,O,O,O,O,O,O,O,O,O],
  [O,O,RE,RE,O,RE,RE,O,O,O,O,RE,RE,O,O,RE,O,O,O,O,RE,RE,RE,RE,RE,O,O,RE,O,RE],
];
const DEMO_INITIAL_DROP_PERIOD_FRAMES = 120;
const DEMO_DROP_PERIOD_FRAMES = 16;
const DEMO_AFTER_DROP_PERIOD_FRAMES = 100;
const DEMO_AFTER_DUNK_PERIOD_FRAMES = 150;
const DEMO_OREO_BUTTON_HOLD_PERIOD_FRAMES = 10;
const DEMO_STATE_BUTTON_HOLD_PERIOD_FRAMES = 20;

const oreoState = {
  groundedDiscs: {
    y: 0,
    dy: 0,
    discTypes: [],
  },
  fallingDiscs: [],
  flungDiscs: [],
  dunkedDiscs: [],
};

let sketchState = "CONSTRUCTING_OREO";
let sceneScale;
let oSound, reSound;
let oreoWordFont;
let oButton1, reButton, oButton2, dunkButton, resetButton;
let demoMode = true;
let lastDemoKeyframe = 0;
let demoOreoIndex = 0;

function preload() {
  oSound = loadSound("assets/kick.mp3");
  reSound = loadSound("assets/snare.mp3");
  oSound.setVolume(0.5);
  reSound.setVolume(0.5);
  oreoWordFont = loadFont("assets/Kanit-ExtraBold.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  sceneScale = width/100;
  setupButtons();
  resetSketch();
}

function setupButtons() {
  oButton1 = createButton("O");
  reButton = createButton("RE");
  oButton2 = createButton("O");
  dunkButton = createButton("Dunk?");
  resetButton = createButton("Again?");
  for (let button of [oButton1, reButton, oButton2, dunkButton, resetButton]) {
    button.style("font-family", "Kanit-ExtraBold");
    button.style("font-size", `${width/8}px`);
    button.style("background-color", "transparent");
    button.style("border", "none");
    button.style("color", "white");
    button.style("padding", "0");
    button.style("border-radius", `${width/40}px`);
    button.style("text-shadow", `${width/150}px ${width/150}px 8px #202020`);
  }

  oButton1.position(width * 0.05,0);
  reButton.position(width * 0.14,0);
  oButton2.position(width * 0.295,0);

  for (let oButton of [oButton1, oButton2]) {
    const mOver = () => {oButton.style("color", O_FILL); oButton.style("background-color", "#ffffff20")};
    const mOut = () => {oButton.style("color", "white"); oButton.style("background-color", "transparent")};
    const mPressed = () => {
      oButton.style("padding", `${width/300}px 0 0 ${width/300}px`);
      oButton.style("text-shadow", `${width/300}px ${width/300}px 4px #202020`);
      if (canSpawnDisc()) spawnDisc(O);
    }
    const mReleased = () => {
      oButton.style("padding", "0");
      oButton.style("text-shadow", `${width/150}px ${width/150}px 8px #202020`);
    }
    oButton.mouseOver(mOver);
    oButton.mouseOut(mOut);
    oButton.mousePressed(mPressed);
    oButton.mouseReleased(mReleased);
    oButton.simulatePress = () => {mOver(); mPressed()};
    oButton.simulateRelease = () => {mReleased(); mOut()};
  }
  
  const mOver = () => {reButton.style("color", RE_FILL); reButton.style("background-color", "#ffffff20")};
  const mOut = () => {reButton.style("color", "white"); reButton.style("background-color", "transparent")};
  const mPressed = () => {
    reButton.style("padding", `${width/300}px 0 0 ${width/300}px`);
    reButton.style("text-shadow", `${width/300}px ${width/300}px 4px #202020`);
    if (canSpawnDisc()) spawnDisc(RE);
  }
  const mReleased = () => {
    reButton.style("padding", "0");
    reButton.style("text-shadow", `${width/150}px ${width/150}px 8px #202020`);
  }
  reButton.mouseOver(mOver);
  reButton.mouseOut(mOut);
  reButton.mousePressed(mPressed);
  reButton.mouseReleased(mReleased);
  reButton.simulatePress = () => {mOver(); mPressed()};
  reButton.simulateRelease = () => {mReleased(); mOut()};

  dunkButton.style("font-size", `${width/20}px`);
  dunkButton.style("display", "flex");
  dunkButton.style("justify-content", "center");
  dunkButton.style("padding-top", "0");
  dunkButton.style("width", `${width*0.27}px`);
  dunkButton.style("height", `${width*0.16}px`);
  dunkButton.position(width*0.685, height - width * 0.14);

  const mOverD = () => {dunkButton.style("background-color", "#ffffff20")};
  const mOutD = () => {dunkButton.style("background-color", "transparent")};
  const mPressedD = () => {
    dunkButton.style("padding", `${width/300}px 0 0 ${width/300}px`);
    dunkButton.style("text-shadow", `${width/300}px ${width/300}px 4px #202020`);
  };
  const mReleasedD = () => {
    dunkButton.style("padding", "0");
    dunkButton.style("text-shadow", `${width/150}px ${width/150}px 8px #202020`);
  }
  dunkButton.mouseOver(mOverD);
  dunkButton.mouseOut(mOutD);
  dunkButton.mousePressed(mPressedD);
  dunkButton.mouseReleased(mReleasedD);
  dunkButton.mouseClicked(() => {
    if (sketchState == "CONSTRUCTING_OREO" & enoughDiscs()) {
      startRotationAnimation();
    }
  });
  dunkButton.simulatePress = () => {mOverD(); mPressedD()};
  dunkButton.simulateRelease = () => {mReleasedD(); mOutD()};

  resetButton.style("font-size", `${width/20}px`);
  resetButton.style("display", "flex");
  resetButton.style("justify-content", "center");
  resetButton.style("padding-top", "0");
  resetButton.style("width", `${width*0.27}px`);
  resetButton.style("height", `${width*0.33}px`);
  resetButton.position(width*0.685, height - width * 0.34);
  
  const mOverR = () => {resetButton.style("background-color", "#ffffff20")};
  const mOutR = () => {resetButton.style("background-color", "transparent")};
  const mPressedR = () => {
    resetButton.style("padding", `${width/300}px 0 0 ${width/300}px`);
    resetButton.style("text-shadow", `${width/300}px ${width/300}px 4px #202020`);
  };
  const mReleasedR = () => {
    resetButton.style("padding", "0");
    resetButton.style("text-shadow", `${width/150}px ${width/150}px 8px #202020`);
  }
  resetButton.mouseOver(mOverR);
  resetButton.mouseOut(mOutR);
  resetButton.mousePressed(mPressedR);
  resetButton.mouseReleased(mReleasedR);
  resetButton.mouseClicked(() => {
    if (sketchState == "FLINGING_OREO" & doneFlinging()) {
      startResetAnimation();
    }
  });
  resetButton.simulatePress = () => {mOverR(); mPressedR()};
  resetButton.simulateRelease = () => {mReleasedR(); mOutR()};
}

function draw() {
  if (demoMode) updateDemo();
  updateOreoState();

  push();
  background(BACKGROUND_COLOR);

  if (sketchState === "FLINGING_OREO" || sketchState === "RESETTING") {
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
  } else if (sketchState === "FLINGING_OREO") {
    oreoRotation = 90;
    translate(0.7*O_DIAMETER*sceneScale, height - 0.7*O_DIAMETER*sceneScale);
    if ((frameCount - animationFrame0) % FLING_PERIOD_FRAMES === 0) {
      flingNextDisc();
    }
  }
  scale(sceneScale);
  drawOreoState(oreoRotation);
  pop();

  // Draw glass of milk and update button transparency
  push();
  let glassTransitionProgress;
  if (sketchState == "CONSTRUCTING_OREO") {
    glassTransitionProgress = 0;
  }
  else if (sketchState === "ROTATING_OREO") {
    const animationFrameNo = frameCount - animationFrame0;
    const glassAnimationProgress = constrain(map(animationFrameNo, 0, ROTATION_FRAMES, 0, 1), 0, 1);
    glassTransitionProgress = sin(90*glassAnimationProgress);
  }
  else if (sketchState === "RESETTING") {
    const animationFrameNo = frameCount - animationFrame0;
    const glassAnimationProgress = constrain(map(animationFrameNo, 0, RESET_FRAMES, 0, 1), 0, 1);
    glassTransitionProgress = 1 - sin(90*glassAnimationProgress);
    if (animationFrameNo > RESET_FRAMES) {
      resetSketch();
    }
  }
  else {
    glassTransitionProgress = 1;
  }

  const glassY = map(glassTransitionProgress, 0, 1, height + O_DIAMETER*sceneScale, height - 0.1*O_DIAMETER*sceneScale);
  translate(width - O_DIAMETER*sceneScale, glassY);
  scale(sceneScale);
  drawGlass();
  for (let button of [oButton1, reButton, oButton2]) {
    button.style("opacity", `${1 - glassTransitionProgress}`);
  }
  pop();

  if (sketchState === "CONSTRUCTING_OREO" && enoughDiscs()) {
    dunkButton.style("visibility", "visible");
    resetButton.style("visibility", "hidden");
  }
  else if (sketchState === "FLINGING_OREO" && doneFlinging()) {
    dunkButton.style("visibility", "hidden");
    resetButton.style("visibility", "visible");
  }
  else {
    dunkButton.style("visibility", "hidden");
    resetButton.style("visibility", "hidden");
  }
}

function updateDemo() {
  const demoFrame = frameCount - lastDemoKeyframe;
  if (sketchState === "CONSTRUCTING_OREO") {
    const droppedDiscCount = oreoState.groundedDiscs.discTypes.length + oreoState.fallingDiscs.length;
    const demoOreo = DEMO_OREOS[demoOreoIndex];

    if (demoFrame === DEMO_OREO_BUTTON_HOLD_PERIOD_FRAMES && droppedDiscCount > 0) {
      for (let button of [oButton1, reButton, oButton2]) {
        button.simulateRelease();
      }
    }

    if (droppedDiscCount === demoOreo.length) {
      if (demoFrame === DEMO_AFTER_DROP_PERIOD_FRAMES - DEMO_STATE_BUTTON_HOLD_PERIOD_FRAMES) {
        dunkButton.simulatePress();
      }
      else if (demoFrame >= DEMO_AFTER_DROP_PERIOD_FRAMES) {
        dunkButton.simulateRelease();
        startRotationAnimation();
        for (let button of [oButton1, reButton, oButton2]) {
          button.simulateRelease();
        }
      }
    } else {
      const shouldDropNextDisc = demoFrame >= (droppedDiscCount ? DEMO_DROP_PERIOD_FRAMES : DEMO_INITIAL_DROP_PERIOD_FRAMES);
      if (shouldDropNextDisc) {
        const demoOreo = DEMO_OREOS[demoOreoIndex];
        if (demoOreo[demoOreo.length - droppedDiscCount - 1] === O) {
          const oButtonToPress = (random() < 1/2) ? oButton1 : oButton2;
          oButtonToPress.simulatePress();
        }
        else {
          reButton.simulatePress();
        }
        lastDemoKeyframe = frameCount;
      }
    }
  }
  else if (sketchState === "FLINGING_OREO" && doneFlinging()) {
    if (demoFrame === DEMO_AFTER_DUNK_PERIOD_FRAMES - DEMO_STATE_BUTTON_HOLD_PERIOD_FRAMES) {
      resetButton.simulatePress();
    }
    else if (demoFrame >= DEMO_AFTER_DUNK_PERIOD_FRAMES) {
      resetButton.simulateRelease();
      startResetAnimation();
      demoOreoIndex += 1;
      demoOreoIndex %= DEMO_OREOS.length;
    }
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
        updateTitle();
        playDisc(lowestFallingDisc.discType);
        if (oreoState.groundedDiscs.discTypes.length >= MAX_DISCS) {
          dunkButton.html("Dunk!");
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
      if (doneFlinging()) {
        lastDemoKeyframe = frameCount;
      }
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
  let textOpacity = 1;
  if (sketchState === "RESETTING") {
    textOpacity -= (frameCount - animationFrame0)/RESET_FRAMES;
  }
  fill(255, textOpacity*255);
  stroke(23,49,86, textOpacity*255);
  textSize(width/12);
  textLeading(width/16);
  strokeWeight(width/80);
  lines = [""];
  for (syllable of oreoState.dunkedDiscs.map(dt => dt == O ? "O" : "RE")) {
    if (textWidth(lines[lines.length - 1]) >= 0.5 * width) {
      lines.push("");
    }
    lines[lines.length - 1] += syllable; 
  }
  text(lines.join("\n"), width * 0.35, height/2 - (textAscent()*0.2));
  pop();
}

function updateTitle() {
  if (oreoState.groundedDiscs.discTypes.length === 0) {
    document.title = "Moreo - Marcus Koh 2021";
  } else {
    let title = "";
    for (let i = oreoState.groundedDiscs.discTypes.length - 1; i >= 0; i--) {
      title += oreoState.groundedDiscs.discTypes[i] === O ? "O" : "RE";
    }
    document.title = title;
  }
}

function playDisc(discType) {
  if (demoMode) return;
  switch(discType) {
    case O:
      oSound.play();
      break;
    default:
      reSound.play();
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
  push();
  angleMode(DEGREES);
  oreoState.fallingDiscs.push({
    // attempt to spawn immediately off-screen
    y: max(((-height/2)/sceneScale - 3)/cos(OREO_CONSTRUCTION_ROTATION), -200), 
    dy: INITIAL_FALLING_SPEED/PHYSICS_FRAMERATE,
    discType: discType,
  });
  pop();
}

function canSpawnDisc() {
  return sketchState === "CONSTRUCTING_OREO" && 
    oreoState.groundedDiscs.discTypes.length + oreoState.fallingDiscs.length < MAX_DISCS;
}

function doneFlinging() {
  return oreoState.groundedDiscs.discTypes.length === 0 & oreoState.flungDiscs.length === 0;
}

function enoughDiscs() {
  return oreoState.groundedDiscs.discTypes.length > 0;
}

function clearOreoState() {
  oreoState.groundedDiscs = {
    y: 0,
    dy: 0,
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

function startResetAnimation() {
  sketchState = "RESETTING";
  animationFrame0 = frameCount + 1;
  updateTitle();
}

function resetSketch() {
  clearOreoState();
  updateTitle();
  sketchState = "CONSTRUCTING_OREO";
  dunkButton.html("Dunk?");
  lastDemoKeyframe = frameCount;
}

// when you hit the spacebar, what's currently on the canvas will be saved (as a
// "thumbnail.png" file) to your downloads folder
function keyTyped() {
  if (key === " ") {
    saveCanvas("thumbnail.png");
  }
}

function mousePressed() {
  if (getAudioContext().state !== "running") {
    getAudioContext().resume();
  }
  demoMode = false;
}

function touchStarted() {
  if (getAudioContext().state !== "running") {
    getAudioContext().resume();
  }
  demoMode = false;
}

// Override default swipe behavior (zooming, scrolling)
function touchMoved() {
  return false;
}
