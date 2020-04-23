///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/cannon.min.js"/>

namespace FudgePhysics_Communication {
  import f = FudgeCore;
  import c = CANNON;


  window.addEventListener("load", init);
  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let cmpCamera: f.ComponentCamera;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let cubes: f.Node[] = new Array();
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
  let bodies = new Array();

  let world = new c.World();


  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));
    hierarchy.appendChild(ground);

    cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
    //  cubes[0].mtxWorld.rotateX(45);
    hierarchy.appendChild(cubes[0]);

    cubes[1] = createCompleteMeshNode("Cube_1", new f.Material("Cube2", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube());
    let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 3, 0));
    hierarchy.appendChild(cubes[1]);

    cubes[2] = createCompleteMeshNode("Cube_1", new f.Material("CubeRay", f.ShaderFlat, new f.CoatColored(new f.Color(0, 0, 1, 1))), new f.MeshCube());
    let cmpCubeTransform3: f.ComponentTransform = cubes[2].getComponent(f.ComponentTransform);
    cmpCubeTransform3.local.translate(new f.Vector3(1, 1, 0));
    cmpCubeTransform3.local.scale(new f.Vector3(0.2, 0.2, 0.2));
    hierarchy.appendChild(cubes[2]);

    cubes[3] = createCompleteMeshNode("Cube_1", new f.Material("CubeRay", f.ShaderFlat, new f.CoatColored(new f.Color(0, 0, 0.5, 1))), new f.MeshCube());
    cmpCubeTransform3 = cubes[3].getComponent(f.ComponentTransform);
    cmpCubeTransform3.local.translate(new f.Vector3(2, 2, 0));
    cmpCubeTransform3.local.scale(new f.Vector3(0.2, 0.2, 0.2));
    hierarchy.appendChild(cubes[3]);



    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    cmpCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //Physics CANNON
    world.gravity = new CANNON.Vec3(0, -9.81, 0);
    world.allowSleep = true;
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
    initializePhysicsBody(cmpCubeTransform, 1, 1);
    initializePhysicsBody(cmpCubeTransform2, 0, 2);
    //EndPhysics

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();
    viewPort.activatePointerEvent(f.EVENT_POINTER.DOWN, true);
    viewPort.addEventListener(f.EVENT_POINTER.DOWN, hndPointerDown);
    viewPort.activatePointerEvent(f.EVENT_POINTER.UP, true);
    viewPort.addEventListener(f.EVENT_POINTER.UP, hndPointerUp);
    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start(f.LOOP_MODE.FRAME_REQUEST, 60, true);
  }

  let from: CANNON.Vec3 = new CANNON.Vec3(-5, 0.3, 0);
  let to: CANNON.Vec3 = getRayEndPoint(from, new f.Vector3(1, 0, 0), 10); //new CANNON.Vec3(5, 0.3, 0);
  let result = new CANNON.RaycastResult();
  let raycastOptions = {};
  let matHit: f.Material = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0, 1, 0, 1)));
  let matNormal: f.Material = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1)));
  let posProjection: f.Vector2;
  let screenPos: f.Vector2;

  function update(): void {
    //Physics CANNON
    world.step(f.Loop.timeFrameGame / 1000);
    applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
    applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
    result.reset();
    world.raycastClosest(from, to, raycastOptions, result);
    if (result.body != null && result.body.id == 1) {
      cubes[0].getComponent(f.ComponentMaterial).material = matHit;
    } else {
      cubes[0].getComponent(f.ComponentMaterial).material = matNormal;
    }

    //EndPhysics

    viewPort.draw();
    fpsDisplay.textContent = "FPS: " + f.Loop.getFpsRealAverage().toFixed(2);
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

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, massVal: number, no: number) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: CANNON.Vec3 = new CANNON.Vec3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
    let pos: CANNON.Vec3 = new CANNON.Vec3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
    let rotation: CANNON.Quaternion = new CANNON.Quaternion();
    rotation.setFromEuler(node.mtxWorld.rotation.x, node.mtxWorld.rotation.y, node.mtxWorld.rotation.z);

    let mat: CANNON.Material = new CANNON.Material();
    mat.friction = 1;
    mat.restitution = 0.95;

    bodies[no] = new CANNON.Body({
      mass: massVal, // kg
      position: pos, // m
      quaternion: rotation,
      shape: new CANNON.Box(scale),
      material: mat,
      allowSleep: true,
      sleepSpeedLimit: 0.25, // Body will feel sleepy if speed<1 (speed == norm of velocity)
      sleepTimeLimit: 1, // Body falls asleep after 1s of sleepiness
      linearDamping: 0.3
    });
    world.addBody(bodies[no]);
  }


  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();
    let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].position.x, bodies[no].position.y, bodies[no].position.z);

    let mutator: f.Mutator = {};
    let tmpRotation: f.Vector3 = makeRotationFromQuaternion(bodies[no].quaternion, node.mtxLocal.rotation);

    mutator["rotation"] = tmpRotation;
    node.mtxLocal.mutate(mutator);
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

  //to define a cannon ray not with it's start and end but direction and length
  function getRayEndPoint(start: f.Vector3, direction: f.Vector3, length: number): f.Vector3 {
    let endpoint: f.Vector3 = f.Vector3.ZERO();
    endpoint.add(start);
    let endDirection: f.Vector3 = direction;
    endDirection.scale(length);
    endpoint.add(endDirection);
    return endpoint;
  }

  function hndPointerDown(_event: f.EventPointer): void {
    let cam: f.Node = cmpCamera.getContainer();
    let mouse: f.Vector2 = new f.Vector2(_event.pointerX, _event.pointerY);
    //Canvas Space to Cam/World Space
    posProjection = viewPort.pointClientToProjection(mouse);
    let projection: f.Vector3 = cmpCamera.project(cmpCamera.pivot.translation);
    let posClient: f.Vector2 = viewPort.pointClipToClient(projection.toVector2());
    let posScreen: f.Vector2 = viewPort.pointClientToScreen(posClient);

    // f.Debug.log("posProj: " + posProjection);
    // f.Debug.log("camProj: " + projection);
    // f.Debug.log("posClient: " + posClient);
    // f.Debug.log("posScreen: " + posScreen);


    //Ray
    let origin: f.Vector3 = new f.Vector3(-posProjection.x * 2, posProjection.y * 2, 1.5);
    origin.transform(cmpCamera.pivot, true);
    let dir: f.Vector3 = new f.Vector3(0, 0, 1);
    dir.transform(cmpCamera.pivot, false); //cmpCamera.ViewProjectionMatrix, false);
    //dir.normalize();

    let end: CANNON.Vec3 = getRayEndPoint(origin, dir, 10);
    let hitResult = new CANNON.RaycastResult();
    let options = {};

    hitResult.reset();
    world.raycastClosest(origin, end, options, hitResult);



    let mutator: f.Mutator = {};
    mutator["translation"] = origin;
    cubes[2].mtxLocal.mutate(mutator);
    mutator["translation"] = end;
    cubes[3].mtxLocal.mutate(mutator);



    bodies[1].position = new CANNON.Vec3(hitResult.hitPointWorld.x, hitResult.hitPointWorld.y, hitResult.hitPointWorld.z);
    // bodies[1].type = CANNON.Body.KINEMATIC;
    // bodies[1].velocity = new CANNON.Vec3(0, 0, 0);

    f.Debug.log("EndCalc:" + dir);
    f.Debug.log("CubePos:" + bodies[1].position);
    f.Debug.log("End:" + end);
    f.Debug.log("Origin:" + origin);
    f.Debug.log(hitResult);
    //f.Debug.log("PosNew: " + bodies[1].position);

  }

  function hndPointerUp(_event: f.EventPointer) {
    // bodies[1].type = CANNON.Body.DYNAMIC;
  }

}