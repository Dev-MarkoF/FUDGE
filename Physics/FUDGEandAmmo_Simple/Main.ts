///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/ammo.js"/>



namespace FudgePhysics_Communication {
  import f = FudgeCore;

  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let cubes: f.Node[] = new Array();
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
  let bodies = new Array();

  let world: Ammo.btDiscreteDynamicsWorld;
  let transform: Ammo.btTransform

  Ammo().then(initializeAmmo);

  function initializeAmmo(): void {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();

    world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    world.setGravity(new Ammo.btVector3(0, -10, 0));
    transform = new Ammo.btTransform();
    init();
  }
  function init(): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    let ground: f.Node = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(20, 0.3, 20));
    hierarchy.appendChild(ground);

    cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
    //cubes[0].mtxWorld.rotateX(45);
    hierarchy.appendChild(cubes[0]);

    cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
    hierarchy.appendChild(cubes[1]);

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //Physics Ammo
    world.setGravity(new Ammo.btVector3(0, -10, 0));
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
    initializePhysicsBody(cmpCubeTransform, 1, 1);
    initializePhysicsBody(cmpCubeTransform2, 1, 2);
    //EndPhysics

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);
  }


  function update(): void {

    //Physics Ammo
    world.stepSimulation(f.Loop.timeFrameGame / 1000);
    applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
    applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
    //EndPhysics

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
      fpsDisplay.textContent = "FPS: " + fps.toString();
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

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, massVal: number, no: number) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: Ammo.btVector3 = new Ammo.btVector3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
    let pos: Ammo.btVector3 = new Ammo.btVector3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
    let transform: Ammo.btTransform = new Ammo.btTransform();
    let quaternionRot: any = makeQuaternionFromRotation(node.mtxWorld.rotation.y, node.mtxWorld.rotation.x, node.mtxWorld.rotation.z);
    let rotation: Ammo.btQuaternion = new Ammo.btQuaternion(quaternionRot[0], quaternionRot[1], quaternionRot[2], quaternionRot[3]);
    transform.setIdentity();
    transform.setOrigin(pos);
    transform.setRotation(rotation);
    let shape: Ammo.btBoxShape = new Ammo.btBoxShape(scale);
    shape.setMargin(0.05);
    let mass: number = massVal;
    let localInertia: Ammo.btVector3 = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    let myMotionState: Ammo.btDefaultMotionState = new Ammo.btDefaultMotionState(transform);
    let rbInfo: Ammo.btRigidBodyConstructionInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
    let body: Ammo.btRigidBody = new Ammo.btRigidBody(rbInfo);
    bodies[no] = body;
    world.addRigidBody(body);
  }


  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();

    let body = bodies[no];
    body.getMotionState().getWorldTransform(transform);
    //body.setLinearVelocity(new Ammo.btVector3(1, 0, 0));

    let origin = transform.getOrigin();
    let tmpPosition: f.Vector3 = new f.Vector3(origin.x(), origin.y(), origin.z());
    let rotation = transform.getRotation();
    let rotQuat = new Array();
    rotQuat.x = rotation.x();
    rotQuat.y = rotation.y();
    rotQuat.z = rotation.z();
    rotQuat.w = rotation.w();

    let mutator: f.Mutator = {};
    let tmpRotation: f.Vector3 = makeRotationFromQuaternion(rotQuat, node.mtxLocal.rotation);

    if (no == 1)
      f.Debug.log(tmpRotation);

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
    angles.x = Math.atan2(sinr_cosp, cosr_cosp) * f.Loop.getFpsRealAverage(); //*Framerate? //* 180;

    // pitch (y-axis rotation)
    let sinp: number = 2 * (q.w * q.y - q.z * q.x);
    if (Math.abs(sinp) >= 1)
      angles.y = copysign(Math.PI / 2, sinp) * f.Loop.getFpsRealAverage(); // use 90 degrees if out of range
    else
      angles.y = Math.asin(sinp) * f.Loop.getFpsRealAverage();

    // yaw (z-axis rotation)
    let siny_cosp: number = 2 * (q.w * q.z + q.x * q.y);
    let cosy_cosp: number = 1 - 2 * (q.y * q.y + q.z * q.z);
    angles.z = Math.atan2(siny_cosp, cosy_cosp) * f.Loop.getFpsRealAverage();;
    //f.Debug.log(angles);
    return angles;
  }

  function makeQuaternionFromRotation(yawY: number, pitchX: number, rollZ: number): number[] { //From C# .Net Quaternion Class
    //  Roll first, about axis the object is facing, then
    //  pitch upward, then yaw to face into the new heading
    let sr: number, cr: number, sp: number, cp: number, sy: number, cy: number;

    let halfRoll: number = rollZ * 0.5;
    sr = Math.sin(halfRoll);
    cr = Math.cos(halfRoll);

    let halfPitch: number = pitchX * 0.5;
    sp = Math.sin(halfPitch);
    cp = Math.cos(halfPitch);

    let halfYaw: number = yawY * 0.5;
    sy = Math.sin(halfYaw);
    cy = Math.cos(halfYaw);

    let result: number[] = [];

    result[0] = cy * sp * cr + sy * cp * sr;
    result[1] = sy * cp * cr - cy * sp * sr;
    result[2] = cy * cp * sr - sy * sp * cr;
    result[3] = cy * cp * cr + sy * sp * sr;

    return result;
  }


  function copysign(a: number, b: number): number {
    return b < 0 ? -Math.abs(a) : Math.abs(a);
  }

}