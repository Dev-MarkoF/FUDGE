///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/ammo.js"/>

let world: Ammo.btDiscreteDynamicsWorld;

Ammo().then(initializeAmmo);

function initializeAmmo(): void {
  let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
    overlappingPairCache = new Ammo.btDbvtBroadphase(),
    solver = new Ammo.btSequentialImpulseConstraintSolver();

  world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  world.setGravity(new Ammo.btVector3(0, -10, 0));
}

namespace FudgePhysics_Communication {
  import f = FudgeCore;

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


  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    hierarchy = new f.Node("Scene");

    ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(50, 0.3, 50));
    hierarchy.appendChild(ground);
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);

    createRandomObject();

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 5, 25));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //Physics Ammo
    world.setGravity(new Ammo.btVector3(0, -10, 0));

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
    applyPhysicsBody(ground.getComponent(f.ComponentTransform), 0);
    for (let i: number = 1; i < bodies.length; i++) { //Alle außer dem Grund
      applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
    }
    //EndPhysics
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

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, massVal: number, no: number, type: number = 0) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: Ammo.btVector3 = new Ammo.btVector3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
    let pos: Ammo.btVector3 = new Ammo.btVector3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
    let transform: Ammo.btTransform = new Ammo.btTransform();
    let quaternionRot: any = makeQuaternionFromRotation(node.mtxWorld.rotation.y, node.mtxWorld.rotation.x, node.mtxWorld.rotation.z);
    let rotation: Ammo.btQuaternion = new Ammo.btQuaternion(quaternionRot[0], quaternionRot[1], quaternionRot[2], quaternionRot[3]);
    transform.setIdentity();
    transform.setOrigin(pos);
    transform.setRotation(rotation);
    let shape: Ammo.Shape;
    if (type == 0)
      shape = new Ammo.btBoxShape(scale);
    else
      shape = new Ammo.btSphereShape(0.5);


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

  let transform: Ammo.btTransform = new Ammo.btTransform();
  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();

    let body = bodies[no];
    body.getMotionState().getWorldTransform(transform);
    //body.setLinearVelocity(new Ammo.btVector3(1, 0, 0));

    let origin = transform.getOrigin();
    let tmpPosition: f.Vector3 = new f.Vector3(origin.x(), origin.y(), origin.z());
    let rotation = transform.getRotation();
    let rotQuat: f.Quaternion = new f.Quaternion(rotation.x(), rotation.y(), rotation.z(), rotation.w());

    let mutator: f.Mutator = {};
    let tmpRotation: f.Vector3 = rotQuat.toDegrees();


    mutator["rotation"] = tmpRotation;
    node.mtxLocal.mutate(mutator);
    mutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(mutator);

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



}