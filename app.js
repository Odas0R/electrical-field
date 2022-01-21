import {
  loadShadersFromURLS,
  loadShadersFromScripts,
  setupWebGL,
  buildProgramFromSources,
} from "./libs/utils.js";
import { vec2, vec3, flatten } from "./libs/MV.js";

let gl;
let canvas;

let program, program1;
let buffer, buffer1;
let uPosition, uPosition1;

const GRID_SPACING = 0.05;
const TABLE_WIDTH = 3.0;
let tableHeight;

let charges = [];
let tempCharges = [];
let grid = [];

const MAX_CHARGES = 20;
const THETA = 0.03;

const pixelInputToGLCoord = (e, canvas) => {
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  let cx = (x / rect.width) * 2 - 1;
  let cy = (y / rect.height) * -2 + 1;

  return { x: cx, y: cy };
};

const draw = () => {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // ==========
  //  grid dots
  // ==========
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.vertexAttribPointer(uPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(uPosition);

  // set the table dimension
  tableHeight = (TABLE_WIDTH * window.innerHeight) / window.innerWidth;

  let uRatio = gl.getUniformLocation(program, "uRatio");
  gl.uniform2f(uRatio, TABLE_WIDTH, tableHeight);

  for (let i = 0; i < charges.length; i++) {
    let x = charges[i].y * Math.sin(THETA) + Math.cos(THETA) * charges[i].x;
    let y = charges[i].x * -Math.sin(THETA) + Math.cos(THETA) * charges[i].y;
    let uCharges = gl.getUniformLocation(program, `uCharges[${i}]`);
    const type = charges[i].type;
    if (type === "negative") {
      gl.uniform3fv(uCharges, flatten(vec3(x, y, -1)));
    } else {
      gl.uniform3fv(uCharges, flatten(vec3(x, y, 1)));
    }
  }

  gl.drawArrays(gl.LINES, 0, grid.length);

  // =============
  //  draw charges
  // =============
  gl.useProgram(program1);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
  gl.vertexAttribPointer(uPosition1, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(uPosition1);

  const chargesToDraw = [];
  for (let i = 0; i < charges.length; i++) {
    const type = charges[i].type;
    if (type === "negative") {
      let x = charges[i].y * Math.sin(THETA) + Math.cos(THETA) * charges[i].x;
      let y = charges[i].x * -Math.sin(THETA) + Math.cos(THETA) * charges[i].y;
      charges[i] = {
        ...charges[i],
        x: x,
        y: y,
      };
      chargesToDraw.push(vec3(x, y, -1.0));
    } else {
      let x = charges[i].y * Math.sin(-THETA) + Math.cos(-THETA) * charges[i].x;
      let y =
        charges[i].x * -Math.sin(-THETA) + Math.cos(-THETA) * charges[i].y;
      charges[i] = {
        ...charges[i],
        x: x,
        y: y,
      };
      chargesToDraw.push(vec3(x, y, 1.0));
    }
  }

  // set the table dimension
  uRatio = gl.getUniformLocation(program1, "uRatio");
  gl.uniform2f(uRatio, TABLE_WIDTH, tableHeight);
  // draw red dots
  if (chargesToDraw.length > 0) {
    gl.bufferData(gl.ARRAY_BUFFER, flatten(chargesToDraw), gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, chargesToDraw.length);
  }
};

// At Init time

// 1. create all shaders and programs and look up locations
// 2. create buffers and upload vertex data
// 3. create textures and upload texture data
const setup = (shaders) => {
  canvas = document.getElementById("gl-canvas");

  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  tableHeight = (TABLE_WIDTH * window.innerHeight) / window.innerWidth;

  gl = setupWebGL(canvas);

  // Create all programs, shaders and look up locations
  //
  program = buildProgramFromSources(
    gl,
    shaders["shader.vert"],
    shaders["shader.frag"]
  );
  uPosition = gl.getAttribLocation(program, "uPosition");

  program1 = buildProgramFromSources(
    gl,
    shaders["shader2.vert"],
    shaders["shader2.frag"]
  );
  uPosition1 = gl.getAttribLocation(program1, "uPosition");

  // Create buffers and upload vertex data
  //
  gl.useProgram(program);

  // Setup buffer for the grid
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.vertexAttribPointer(uPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(uPosition);

  let uRatio = gl.getUniformLocation(program, "uRatio");
  gl.uniform2f(uRatio, TABLE_WIDTH, tableHeight);

  grid = [];
  for (let x = 0; x <= TABLE_WIDTH / 2; x += GRID_SPACING) {
    for (let y = 0; y <= tableHeight / 2; y += GRID_SPACING) {
      const getRandomNoise = () => {
        const random = Math.random();
        return random % 2 === 0
          ? (random * GRID_SPACING) / 2
          : (-random * GRID_SPACING) / 2;
      };

      let noiseX = getRandomNoise();
      let noiseY = getRandomNoise();
      grid.push(vec3(x + noiseX, y + noiseY, 1));
      grid.push(vec3(x + noiseX, y + noiseY, -1));

      noiseX = getRandomNoise();
      noiseY = getRandomNoise();
      grid.push(vec3(-x + noiseX, y + noiseY, 1));
      grid.push(vec3(-x + noiseX, y + noiseY, -1)); // non-static

      noiseX = getRandomNoise();
      noiseY = getRandomNoise();
      grid.push(vec3(x + noiseX, -y + noiseY, 1));
      grid.push(vec3(x + noiseX, -y + noiseY, -1)); // non-static

      noiseX = getRandomNoise();
      noiseY = getRandomNoise();
      grid.push(vec3(-x + noiseX, -y + noiseY, 1));
      grid.push(vec3(-x + noiseX, -y + noiseY, -1)); // non-static
    }
  }

  // draw grid
  //
  gl.bufferData(gl.ARRAY_BUFFER, flatten(grid), gl.STATIC_DRAW);
  gl.drawArrays(gl.LINES, 0, grid.length);

  // Setup buffer for the charges
  buffer1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
  gl.vertexAttribPointer(uPosition1, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(uPosition1);

  //
  // UI Events
  //
  canvas.addEventListener("click", (e) => {
    if (charges.length === MAX_CHARGES) {
      return alert(`You can only have ${MAX_CHARGES}`);
    }

    const coords = pixelInputToGLCoord(e, canvas);
    const charge = {
      type: e.shiftKey ? "negative" : "positive",
      ...coords,
    };
    charges.push(charge);

    draw();
  });

  window.addEventListener("keydown", (e) => {
    if (e.keyCode === 32) {
      if (charges.length === 0) {
        charges = tempCharges;
      } else {
        tempCharges = charges;
        charges = [];
      }

      draw();
    }
  });

  window.addEventListener("resize", () => {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    tableHeight = window.innerHeight;

    gl.viewport(0, 0, canvas.width, canvas.height);
  });

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  window.requestAnimationFrame(animate);
};

function animate() {
  draw();

  window.requestAnimationFrame(animate);
}

loadShadersFromURLS([
  "shader.vert",
  "shader.frag",
  "shader2.vert",
  "shader2.frag",
]).then((shaders) => setup(shaders));
