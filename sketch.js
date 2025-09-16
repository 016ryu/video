let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;

let engine, world;
let ground;
let mConstraint;

let textStr = "Hi there❕                                              We are Sparkool, an independent creative design team based in Tokyo. ";

let chars = [];
let bodies = [];
let appearIndex = 0; 
let appearInterval = 50; 

let brains = [];
let explosionAdded = false;

// PNG 图片
let imgsp1, imgsp2, imgz1, imgz2;

function preload() {
  imgsp1 = loadImage("sp1.png");
  imgsp2 = loadImage("sp2.png");
  imgz1 = loadImage("z1.png"); 
  imgz2 = loadImage("z2.png");
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);

  engine = Engine.create();
  world = engine.world;
  engine.world.gravity.y = 0.3;

  chars = textStr.split("");
  let radius = 10;
  let spacing = 5; 
  let startY = 50;
  let lineHeight = 25;
  let maxLineWidth = width - 100;
  let x = 50;
  let y = startY;

  for (let i = 0; i < chars.length; i++) {
    let char = chars[i];

    if (x + radius*2 > maxLineWidth && char === " ") {
      x = 50;
      y += lineHeight;
    }

    let circle = Bodies.circle(x, y, radius, { 
      restitution: 0.75, 
      friction: 0.05,
      frictionAir: 0.001,
      density: 0.001
    });

    circle.char = char; 
    circle.collided = false; 
    Body.setStatic(circle, true); 
    bodies.push(circle);
    World.add(world, circle);

    x += radius*2 + spacing;
  }

  // 地面
  ground = Bodies.rectangle(width/2, height, width, 40, { isStatic: true });
  World.add(world, ground);

  // 鼠标控制
  let canvasMouse = Mouse.create(canvas.elt);
  canvasMouse.pixelRatio = pixelDensity();
  mConstraint = MouseConstraint.create(engine, {
    mouse: canvasMouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  World.add(world, mConstraint);

  textAlign(CENTER, CENTER);
  textSize(20);
  fill(0, 0, 0);

  // 逐字出现
  let appearTimer = setInterval(() => {
    if (appearIndex < bodies.length) {
      appearIndex++;
    } else {
      clearInterval(appearTimer);
      setTimeout(() => {
        addBrains();
      }, 2000);
    }
  }, appearInterval);

  // 碰撞事件
  Matter.Events.on(engine, "collisionStart", function(event) {
    let pairs = event.pairs;
    for (let pair of pairs) {
      let a = pair.bodyA;
      let b = pair.bodyB;

      // sp1 - sp2 碰撞 → 爆炸
      if (((a.char === "sp1" && b.char === "sp2") || (a.char === "sp2" && b.char === "sp1")) && !explosionAdded) {
        let x = (a.position.x + b.position.x) / 2;
        let y = (a.position.y + b.position.y) / 2;
        addExplosion(x, y);
      }

      // 普通文字旋转
      [a,b].forEach(body => {
        if (body.char && !body.collided && body.char !== "sp1" && body.char !== "sp2" && body.char !== "z1" && body.char !== "z2") {
          body.collided = true;
          Body.setAngularVelocity(body, random(-0.1,0.1)); 
        }
      });
    }
  });
}

function addBrains() {
  let radiusS1 = 120;
  let radiusS2 = 120;
  let y = height/2;

  // sp1
  let leftBrain = Bodies.circle(-radiusS1, y, radiusS1, { restitution: 0.9, friction:0.05 });
  leftBrain.char = "sp1";  
  Body.setVelocity(leftBrain, { x: 10, y: 0 }); 

  // sp2
  let rightBrain = Bodies.circle(width + radiusS2, y + 10, radiusS2, { restitution: 0.9, friction:0.05 });
  rightBrain.char = "sp2";  
  Body.setVelocity(rightBrain, { x: -10, y: 0 });

  brains.push(leftBrain, rightBrain);
  World.add(world, brains);

  // 文字掉落
  bodies.forEach(b => {
    Body.setStatic(b, false);
    Body.setVelocity(b, { x: random(-1.5, 1.5), y: random(0, 1) });
  });
}

// sp1/sp2 碰撞生成 z1 + z2
function addExplosion(x, y) {
  let explosion1 = Bodies.circle(x - 30, y, 20, { restitution:0.3, friction:0.05 });
  explosion1.char = "z1";
  World.add(world, explosion1);

  let explosion2 = Bodies.circle(x + 30, y, 80, { restitution:0.3, friction:0.05 });
  explosion2.char = "z2";
  World.add(world, explosion2);

  explosionAdded = true;

  brains.forEach(b => {
    let dx = b.position.x - x;
    let dy = b.position.y - y;
    let angle = Math.atan2(dy, dx);
    Body.setVelocity(b, { x: Math.cos(angle) * 0.4, y: Math.sin(angle) * 1.0 });
    Body.setAngularVelocity(b, random(-0.01, 0));
  });

  bodies.forEach(b => {
    if (!b.collided) {
      b.collided = true;
      Body.setAngularVelocity(b, random(-0.01,0));
    }
  });
}

function draw() {
  background(255, 255, 255);
  Engine.update(engine);

  // 显示文字
  for (let i = 0; i < appearIndex; i++) {
    let body = bodies[i];
    push();
    translate(body.position.x, body.position.y);
    rotate(body.angle);
    textSize(20);
    text(body.char, 0, 0);
    pop();
  }

  Composite.allBodies(world).forEach(body => {
    push();
    translate(body.position.x, body.position.y);
    rotate(body.angle);
    imageMode(CENTER);

    // 保持 sp1/sp2 原始比例
    if (body.char === "sp1") {
      let scale = 0.3;
      image(imgsp1, 0, 0, imgsp1.width*scale, imgsp1.height*scale);
    } 
    else if (body.char === "sp2") {
      let scale = 0.3;
      image(imgsp2, 0, 0, imgsp2.width*scale, imgsp2.height*scale);
    } 
    else if (body.char === "z1") {
      let scale = 0.1;
      image(imgz1, 0, 0, imgz1.width*scale, imgz1.height*scale);
    }
    else if (body.char === "z2") {
      let scale = 0.1;
      image(imgz2, 0, 0, imgz2.width*scale, imgz2.height*scale);
    }

    pop();
  });
}