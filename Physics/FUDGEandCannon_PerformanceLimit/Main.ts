///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/cannon.min.js"/>

namespace FudgePhysics_Communication {
  import f = FudgeCore;
  import c = CANNON;


  window.addEventListener("load", init);
  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let cubes: f.Node[] = new Array();
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
  let bodies = new Array();
  let ground: f.Node;
  let cubeNo: number = 0;
  let time: number = 0;
  let starttimer: number = 2;

  let world = new c.World();

  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);
    cmpGroundMesh.local.scale(new f.Vector3(20, 0.3, 20));
    hierarchy.appendChild(ground);
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0, 0);

    createRandomObject();

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 5, 25));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //Physics CANNON
    world.gravity = new CANNON.Vec3(0, -9.81, 0);
    //world.solver.iterations = 10;
    world.allowSleep = true;
    //EndPhysics

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start(f.LOOP_MODE.FRAME_REQUEST, 60, true);
  }


  function update(): void {
    if (starttimer <= 0) {
      //Physics CANNON
      world.step(f.Loop.timeFrameGame / 1000);
      //world.step(1 / 60);
      applyPhysicsBody(ground.getComponent(f.ComponentTransform), 0);
      for (let i: number = 1; i < bodies.length; i++) {
        applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
      }
      //EndPhysics
    } else {
      starttimer -= f.Loop.timeFrameGame / 1000;
    }
    time += f.Loop.timeFrameReal / 1000;

    viewPort.draw();
    measureFPS();
  }

  function measureFPS(): void {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      fpsDisplay.textContent = "FPS: " + fps.toString() + " / Rigidbodies: " + bodies.length + " / Time: " + time.toFixed(2);
    });
  }

  function createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh): f.Node {
    let node: f.Node = new f.Node(_name);
    let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
    let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);

    let cmpTransform: f.ComponentTransform = new f.ComponentTransform();
    node.addComponent(cmpMesh);
    node.addComponent(cmpMaterial);
    node.addComponent(cmpTransform);

    return node;
  }

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, massVal: number, no: number, _shape: number) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: CANNON.Vec3 = new CANNON.Vec3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
    let pos: CANNON.Vec3 = new CANNON.Vec3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
    let rotation: CANNON.Quaternion = new CANNON.Quaternion();
    rotation.setFromEuler(node.mtxWorld.rotation.x, node.mtxWorld.rotation.y, node.mtxWorld.rotation.z);

    let mat: CANNON.Material = new CANNON.Material();
    mat.friction = 1;
    mat.restitution = 0;
    f.Debug.log("body created: " + cubeNo);
    bodies[no] = new CANNON.Body({
      mass: massVal, // kg
      position: pos, // m
      quaternion: rotation,
      shape: _shape == 0 ? new CANNON.Box(scale) : new CANNON.Sphere(1),
      material: mat,
      allowSleep: true,
      sleepSpeedLimit: 0.25, // Body will feel sleepy if speed<1 (speed == norm of velocity)
      sleepTimeLimit: 1 // Body falls asleep after 1s of sleepiness
    });
    world.addBody(bodies[no]);
  }


  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();
    let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].position.x, bodies[no].position.y, bodies[no].position.z);

    let mutator: f.Mutator = {};
    let tmpQuat: f.Quaternion = new f.Quaternion(bodies[no].quaternion.x, bodies[no].quaternion.y, bodies[no].quaternion.z, bodies[no].quaternion.w);
    let tmpRotation: f.Vector3 = tmpQuat.toDegrees();
    //f.Debug.log(tmpRotation);
    mutator["rotation"] = tmpRotation;
    mutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(mutator);
  }


  function makeRotationFromQuaternion(q: any, targetAxis: f.Vector3 = new f.Vector3(1, 1, 1)): f.Vector3 {
    let angles: f.Vector3 = new f.Vector3();

    // roll (x-axis rotation)
    let sinr_cosp: number = 2 * (q.w * q.x + q.y * q.z);
    let cosr_cosp: number = 1 - 2 * (q.x * q.x + q.y * q.y);
    angles.x = Math.atan2(sinr_cosp, cosr_cosp) * f.Loop.getFpsRealAverage(); //*Framerate? ;

    // pitch (y-axis rotation)
    let sinp: number = 2 * (q.w * q.y - q.z * q.x);
    if (Math.abs(sinp) >= 1)
      angles.y = copysign(Math.PI / 2, sinp) * f.Loop.getFpsRealAverage(); // use 90 degrees if out of range
    else
      angles.y = Math.asin(sinp) * f.Loop.getFpsRealAverage();

    // yaw (z-axis rotation)
    let siny_cosp: number = 2 * (q.w * q.z + q.x * q.y);
    let cosy_cosp: number = 1 - 2 * (q.y * q.y + q.z * q.z);
    angles.z = Math.atan2(siny_cosp, cosy_cosp) * f.Loop.getFpsRealAverage();
    //f.Debug.log(angles);
    return angles;
  }


  function copysign(a: number, b: number): number {
    return b < 0 ? -Math.abs(a) : Math.abs(a);
  }

  function createRandomObject(): void {
    let type: number = f.random.getRangeFloored(0, 2);
    let mesh: f.Mesh = type == 0 ? new f.MeshCube() : new f.MeshSphere();
    cubes[cubeNo] = createCompleteMeshNode("Cube_" + cubeNo.toString(), new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), mesh);
    let cmpCubeTransform: f.ComponentTransform = cubes[cubeNo].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 10, 0));
    hierarchy.appendChild(cubes[cubeNo]);
    initializePhysicsBody(cmpCubeTransform, 1, 1 + cubeNo, type);
    cubeNo++;

    setTimeout(createRandomObject, 100);
  }

}
