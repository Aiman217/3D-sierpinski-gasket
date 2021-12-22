//CPC354/CMT324 ASSIGNMENT 1
//Group member:
//1. Muhammad Aiman Arif Bin Baharudin (146824)
//2. Xian Zhi Rong (140646)

var canvas;
var gl;
var points = [];
var colors = [];
var baseColors = [
  vec4(1.0, 0, 0.0, 1.0),
  vec4(1.0, 1.0, 0.0, 1.0),
  vec4(0.0, 0.0, 1.0, 1.0),
  vec4(0.0, 1.0, 1.0, 1.0),
];

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext('webgl2');

  if (!gl) {
    alert("WebGL 2.0 isn't available");
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.157, 0.157, 0.157, 1.0);
  gl.enable(gl.DEPTH_TEST);
  const program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  const controls = {};
  controls.vColor = gl.getAttribLocation(program, "vColor");
  controls.vPosition = gl.getAttribLocation(program, "vPosition");
  controls.thetaLoc = gl.getUniformLocation(program, "theta");
  controls.scaleLoc = gl.getUniformLocation(program, "scale");
  controls.transLoc = gl.getUniformLocation(program, "trans");

  //Gasket values
  const gasket = {
    vertices: [
      vec3(0.0, 0.0, -0.25),
      vec3(0.0, 0.2357, 0.0833),
      vec3(-0.2041, -0.1179, 0.0833),
      vec3(0.2041, -0.1179, 0.0833),
    ],
    division: 0,
    speed: 200,
    theta: [0, 0, 0],
    degree: 180,
    scale: 1,
    scaleFac: 1,
    trans: [0.0, 0.0],
    pause: true,
  };

  //TV animation ident
  const animsRegistry = obj => [
    rotation.bind(null, obj, -obj.degree, 2),
    rotation.bind(null, obj, obj.degree, 2),
    rotation.bind(null, obj, 0, 2),

    scaling.bind(null, obj, obj.scaleFac),

    setDelta.bind(null, obj),
    translation.bind(null, obj),
  ];

  const settings = Array.from(document.querySelectorAll(".settings"));
  settings.forEach(setting => {
    setting.addEventListener("change", () => {
      gasket[setting.name] = Number(setting.value);
      let textbox = document.querySelector(
        `[class="textbox"][name="${setting.name}"]`
      );

      if (textbox !== null) {
        textbox.value = setting.value;
      }

      renderObject(controls, gasket);
      gasket.anims = animsRegistry(gasket);
      gasket.currentAnim = gasket.anims.shift();
    });
  });

  //Event listener for colour picker
  const colorPickers = Array.from(document.querySelectorAll(".colorpicker"));
  colorPickers.forEach((cP, i) => {
    cP.addEventListener("change", () => {
      baseColors[i] = hex2rgb(cP.value);
      renderObject(controls, gasket);
    });
  });

  //Event listener for start button
  const startBtn = document.getElementById("start-button");
  startBtn.addEventListener("click", () => {
    if (!gasket.pause) {
      gasket.pause = true;
      startBtn.value = "Start";
    } else {
      gasket.pause = false;
      animate(gasket, controls);
      startBtn.value = "Stop";
    }
  });

  //Event listener for restart button
  restartBtn = document.getElementById("restart-button"); // global var
  restartBtn.disabled = true;
  restartBtn.addEventListener("click", () => {
    gasket.pause = true;
    gasket.theta = [0, 0, 0];
    gasket.trans = [0.0, 0.0];
    gasket.scale = 1; 
    renderObject(controls, gasket);
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
    restartBtn.disabled = true;
    startBtn.value = "Start";    
  });

  renderObject(controls, gasket);
  gasket.anims = animsRegistry(gasket);
  gasket.currentAnim = gasket.anims.shift();
};

//Function to animate gasket
function animate(obj, controls) {
  if (obj.pause === true) {
    return;
  }
  if (obj.anims.length === 1) {
    restartBtn.disabled = false;
  }
  if (obj.currentAnim()) {
    obj.currentAnim = obj.anims.shift(); 
  } else {
    gl.uniform3fv(controls.thetaLoc, flatten(obj.theta));
    gl.uniform1f(controls.scaleLoc, obj.scale);
    gl.uniform2fv(controls.transLoc, obj.trans);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
  }
  requestAnimationFrame(() => animate(obj, controls));
}

//Function to rotate the gasket/object
function rotation(obj, degree, axis) {
    let difference = degree - obj.theta[2];
    if (Math.abs(difference) > obj.speed * 0.01) {
      obj.theta[2] += Math.sign(difference) * obj.speed * 0.01;
      return false;
    } else {
      obj.theta[2] = degree;
      return true;
    }
}

//Function to scale the gasket/object whether scale up or down
function scaling(obj, scaleFac) {
  let difference = scaleFac - obj.scale;
  if (Math.abs(difference) > obj.speed * 0.0005) {
    obj.scale += Math.sign(difference) * obj.speed * 0.0005;
    return false;
  } else {
    obj.scale = scaleFac;
    return true;
  }
}

//Function to move gasket/object
function translation(obj) {
  if (
    obj.vertices.some(
      v => Math.abs(v[0] + obj.trans[0] / obj.scale) > 0.97 / obj.scale
    )
  ) {
    obj.deltaX = -obj.deltaX;
  }
  if (
    obj.vertices.some(
      v => Math.abs(v[1] + obj.trans[1] / obj.scale) > 0.97 / obj.scale
    )
  ) {
    obj.deltaY = -obj.deltaY;
  }
  obj.trans[0] += obj.deltaX;
  obj.trans[1] += obj.deltaY;
  return false;
}

//Function to convert hex value colour to rgb value colour
function hex2rgb(hex) {
  let bigint = parseInt(hex.substring(1), 16);
  let R = ((bigint >> 16) & 255) / 255;
  let G = ((bigint >> 8) & 255) / 255;
  let B = (bigint & 255) / 255;
  return vec4(R, G, B, 1.0);
}

function setDelta(obj) {
  obj.deltaX = obj.speed * Math.cos(Math.PI / 3) * 0.00004;
  obj.deltaY = obj.speed * Math.sin(Math.PI / 3) * 0.00004;
  return true;
}

function renderObject(controls, obj) {
  points = [];
  colors = [];
  divideTetra(
    obj.vertices[0],
    obj.vertices[1],
    obj.vertices[2],
    obj.vertices[3],
    obj.division
  );

  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(controls.vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(controls.vColor);

  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  gl.vertexAttribPointer(controls.vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(controls.vPosition);

  gl.uniform3fv(controls.thetaLoc, flatten(obj.theta));
  gl.uniform1f(controls.scaleLoc, obj.scale);
  gl.uniform2fv(controls.transLoc, obj.trans);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

function triangle(a, b, c, color) {
  colors.push(baseColors[color]);
  points.push(a);
  colors.push(baseColors[color]);
  points.push(b);
  colors.push(baseColors[color]);
  points.push(c);
}

//Function to create tetrahedron 
function tetra(a, b, c, d) {
  triangle(a, c, b, 0);
  triangle(a, c, d, 1);
  triangle(a, b, d, 2);
  triangle(b, c, d, 3);
}

//Function to do division of tetradedron
function divideTetra(a, b, c, d, count) {
  if (count === 0) {
    tetra(a, b, c, d);
  } 
  else {
    let ab = mix(a, b, 0.5);
    let ac = mix(a, c, 0.5);
    let ad = mix(a, d, 0.5);
    let bc = mix(b, c, 0.5);
    let bd = mix(b, d, 0.5);
    let cd = mix(c, d, 0.5);

    --count;
    divideTetra(a, ab, ac, ad, count);
    divideTetra(ab, b, bc, bd, count);
    divideTetra(ac, bc, c, cd, count);
    divideTetra(ad, bd, cd, d, count);
  }
}
