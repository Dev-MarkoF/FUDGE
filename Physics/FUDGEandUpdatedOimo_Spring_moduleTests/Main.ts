///<reference path="../../Core/Build/FudgeCore.d.ts"/>
///<reference path="../Physics_Library/OimoPhysics.d.ts"/>

import { oimo } from "../Physics_Library/OimoPhysics";




namespace FudgePhysics_Communication {
  //import oimo = window.OIMO;

  import f = FudgeCore;
  f.Debug.log("Test");
  window.addEventListener("load", init);
  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let cubes: f.Node[] = new Array();
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");
  let bodies = new Array();
  let world = new oimo.dynamics.World();
  let floorSpring: oimo.dynamics.constraint.joint.Joint;

  let matHit: f.Material = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0, 1, 0, 1)));
  let matNormal: f.Material = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1)));

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
    cmpCubeTransform.local.translate(new f.Vector3(0, 1.5, 0));
    //cubes[0].mtxLocal.rotateX(45);
    hierarchy.appendChild(cubes[0]);

    cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
    hierarchy.appendChild(cubes[1]);

    cubes[2] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform3: f.ComponentTransform = cubes[2].getComponent(f.ComponentTransform);
    cmpCubeTransform3.local.translate(new f.Vector3(0, 7, 0.4));
    hierarchy.appendChild(cubes[2]);

    cubes[3] = createCompleteMeshNode("Cube_4", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform4: f.ComponentTransform = cubes[3].getComponent(f.ComponentTransform);
    cmpCubeTransform4.local.translate(new f.Vector3(0, 15, 0.4));
    hierarchy.appendChild(cubes[3]);

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 15));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());

    //Physics OIMO
    initializePhysicsBody(ground.getComponent(f.ComponentTransform), false, 0);
    initializePhysicsBody(cmpCubeTransform, true, 1);
    initializePhysicsBody(cmpCubeTransform2, true, 2);
    initializePhysicsBody(cmpCubeTransform3, true, 3);
    initializePhysicsBody(cmpCubeTransform4, true, 4);
    floorSpring = addPrismaticJoint(bodies[0], bodies[1]);
    floorSpring.setBreakForce(100);
    //EndPhysics

    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start();
  }

  function update(): void {

    //Physics OIMO
    world.step(f.Loop.timeFrameGame / 1000);
    applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
    applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
    applyPhysicsBody(cubes[2].getComponent(f.ComponentTransform), 3);
    applyPhysicsBody(cubes[3].getComponent(f.ComponentTransform), 4);
    //EndPhysics
    raycastMatChange();

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

  function initializePhysicsBody(_cmpTransform: f.ComponentTransform, dynamic: boolean, no: number) {
    let node: f.Node = _cmpTransform.getContainer();
    let scale: oimo.common.Vec3 = new oimo.common.Vec3(node.mtxLocal.scaling.x / 2, node.mtxLocal.scaling.y / 2, node.mtxLocal.scaling.z / 2);
    let shapec: oimo.dynamics.rigidbody.ShapeConfig = new oimo.dynamics.rigidbody.ShapeConfig();
    let geometry: oimo.collision.geometry.Geometry = new oimo.collision.geometry.BoxGeometry(scale);
    shapec.geometry = geometry;
    let massData: oimo.dynamics.rigidbody.MassData = new oimo.dynamics.rigidbody.MassData();
    massData.mass = 1;

    let bodyc: oimo.dynamics.rigidbody.RigidBodyConfig = new oimo.dynamics.rigidbody.RigidBodyConfig();
    bodyc.type = dynamic ? oimo.dynamics.rigidbody.RigidBodyType.DYNAMIC : oimo.dynamics.rigidbody.RigidBodyType.STATIC;
    bodyc.position = new oimo.common.Vec3(node.mtxLocal.translation.x, node.mtxLocal.translation.y, node.mtxLocal.translation.z);
    bodyc.rotation.fromEulerXyz(new oimo.common.Vec3(node.mtxLocal.rotation.x, node.mtxLocal.rotation.y, node.mtxLocal.rotation.z));
    let rb: oimo.dynamics.rigidbody.RigidBody = new oimo.dynamics.rigidbody.RigidBody(bodyc);
    rb.addShape(new oimo.dynamics.rigidbody.Shape(shapec));
    rb.setMassData(massData);
    rb.getShapeList().setRestitution(0);
    rb.getShapeList().setFriction(1);
    bodies[no] = rb;
    world.addRigidBody(rb);
  }

  function applyPhysicsBody(_cmpTransform: f.ComponentTransform, no: number): void {
    let node: f.Node = _cmpTransform.getContainer();
    let tmpPosition: f.Vector3 = new f.Vector3(bodies[no].getPosition().x, bodies[no].getPosition().y, bodies[no].getPosition().z);

    let rotMutator: f.Mutator = {};
    let tmpRotation: f.Vector3 = makeRotationFromQuaternion(bodies[no].getOrientation());
    rotMutator["rotation"] = tmpRotation;
    rotMutator["translation"] = tmpPosition;
    node.mtxLocal.mutate(rotMutator);
  }

  function raycastMatChange(): void {
    let ray: oimo.dynamics.callback.RayCastClosest = new oimo.dynamics.callback.RayCastClosest();
    let begin: oimo.common.Vec3 = new oimo.common.Vec3(- 5, 0.3, 0);
    let end: oimo.common.Vec3 = getRayEndPoint(begin, new f.Vector3(1, 0, 0), 10);
    ray.clear();
    world.rayCast(begin, end, ray);
    if (ray.hit)
      cubes[0].getComponent(f.ComponentMaterial).material = matHit;
    else {
      cubes[0].getComponent(f.ComponentMaterial).material = matNormal;
    }
  }

  function makeRotationFromQuaternion(q: any): f.Vector3 { //
    let angles: f.Vector3 = new f.Vector3();

    // roll (x-axis rotation)
    let sinr_cosp: number = 2 * (q.w * q.x + q.y * q.z);
    let cosr_cosp: number = 1 - 2 * (q.x * q.x + q.y * q.y);
    angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60;

    // pitch (y-axis rotation)
    let sinp: number = 2 * (q.w * q.y - q.z * q.x);
    if (Math.abs(sinp) >= 1)
      angles.y = copysign(Math.PI / 2, sinp) * 60; // use 90 degrees if out of range
    else
      angles.y = Math.asin(sinp);

    // yaw (z-axis rotation)
    let siny_cosp: number = 2 * (q.w * q.z + q.x * q.y);
    let cosy_cosp: number = 1 - 2 * (q.y * q.y + q.z * q.z);
    angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60;
    return angles;
  }

  function copysign(a: number, b: number): number {
    return b < 0 ? -Math.abs(a) : Math.abs(a);
  }

  function getRayEndPoint(start: f.Vector3, direction: f.Vector3, length: number): f.Vector3 {
    let endpoint: f.Vector3 = f.Vector3.ZERO();
    endpoint.add(start);
    let endDirection: f.Vector3 = direction;
    endDirection.scale(length);
    endpoint.add(endDirection);
    return endpoint;
  }

  function addPrismaticJoint(rb1: oimo.dynamics.rigidbody.RigidBody, rb2: oimo.dynamics.rigidbody.RigidBody): oimo.dynamics.constraint.joint.PrismaticJoint {
    let axis: oimo.common.Vec3 = new oimo.common.Vec3(0, 1, 0);
    let anchor: oimo.common.Vec3 = rb1.getPosition();
    let jc: oimo.dynamics.constraint.joint.PrismaticJointConfig = new oimo.dynamics.constraint.joint.PrismaticJointConfig();
    jc.init(rb1, rb2, anchor, axis);
    let springDamper: oimo.dynamics.constraint.joint.SpringDamper = new oimo.dynamics.constraint.joint.SpringDamper().setSpring(3, 0.2);
    let limitMotor: oimo.dynamics.constraint.joint.TranslationalLimitMotor = new oimo.dynamics.constraint.joint.TranslationalLimitMotor().setLimits(0, 0);
    jc.springDamper = springDamper;
    jc.limitMotor = limitMotor;
    let j: oimo.dynamics.constraint.joint.PrismaticJoint = new oimo.dynamics.constraint.joint.PrismaticJoint(jc);
    world.addJoint(j);
    return j;
  }


}