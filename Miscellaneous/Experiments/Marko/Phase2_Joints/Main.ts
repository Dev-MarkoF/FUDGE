///<reference types="../../../../Core/Build/FudgeCore.js"/>
import f = FudgeCore;



namespace FudgePhysics_Communication {

  window.addEventListener("load", init);
  const app: HTMLCanvasElement = document.querySelector("canvas");
  let viewPort: f.Viewport;
  let hierarchy: f.Node;
  let fps: number;
  const times: number[] = [];
  let fpsDisplay: HTMLElement = document.querySelector("h2#FPS");

  let bodies: f.Node[] = new Array();
  let ground: f.Node;
  let cmpCamera: f.ComponentCamera;

  let stepWidth: number = 0.1;
  let moveableTransform: f.ComponentTransform;

  //Joints
  let prismaticJoint: f.ComponentJointPrismatic;
  let prismaticJointSlide: f.ComponentJointPrismatic;
  let revoluteJointSwingDoor: f.ComponentJointRevolute;
  let cylindricalJoint: f.ComponentJointCylindrical;
  let sphericalJoint: f.ComponentJointSpherical;
  let universalJoint: f.ComponentJointUniversal;
  let secondUniversalJoint: f.ComponentJointUniversal;


  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    f.Physics.initializePhysics();
    hierarchy = new f.Node("Scene");

    document.addEventListener("keypress", hndKey);
    document.addEventListener("keydown", hndKeyDown);

    ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);
    cmpGroundMesh.local.scale(new f.Vector3(14, 0.3, 14));

    cmpGroundMesh.local.translate(new f.Vector3(0, -1.5, 0));
    hierarchy.appendChild(ground);

    //Prismatic Joints
    bodies[0] = createCompleteMeshNode("Spring_Floor", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_2);
    let cmpCubeTransform: f.ComponentTransform = bodies[0].getComponent(f.ComponentTransform);
    hierarchy.appendChild(bodies[0]);
    cmpCubeTransform.local.translate(new f.Vector3(0, 1, 0));
    cmpCubeTransform.local.scaleY(0.2);
    prismaticJoint = new f.ComponentJointPrismatic(bodies[0].getComponent(f.ComponentRigidbody), ground.getComponent(f.ComponentRigidbody));
    bodies[0].addComponent(prismaticJoint);
    prismaticJoint.springDamping = 0;
    prismaticJoint.springFrequency = 1;
    prismaticJoint.internalCollision = true;

    bodies[3] = createCompleteMeshNode("CubeJointBase", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[3]);
    bodies[3].mtxLocal.translate(new f.Vector3(-4, 2, -2));
    bodies[3].mtxLocal.scale(new f.Vector3(2, 0.5, 0.5));

    bodies[4] = createCompleteMeshNode("CubeJointSlide", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[4]);
    bodies[4].mtxLocal.translate(new f.Vector3(-4, 2, -2));
    prismaticJointSlide = new f.ComponentJointPrismatic(bodies[3].getComponent(f.ComponentRigidbody), bodies[4].getComponent(f.ComponentRigidbody), new f.Vector3(1, 0, 0));
    bodies[3].addComponent(prismaticJointSlide);
    prismaticJointSlide.motorForce = 10; //so it does not slide too much on it's own.
    prismaticJointSlide.motorLimitLower = -1;
    prismaticJointSlide.motorLimitUpper = 1;

    //Revolute Joint
    bodies[5] = createCompleteMeshNode("Handle", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[5]);
    bodies[5].mtxLocal.translate(new f.Vector3(3.5, 2, -2));
    bodies[5].mtxLocal.scale(new f.Vector3(0.5, 2, 0.5));

    bodies[6] = createCompleteMeshNode("SwingDoor", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[6]);
    bodies[6].mtxLocal.translate(new f.Vector3(4.25, 2, -2));
    bodies[6].mtxLocal.scale(new f.Vector3(1.5, 2, 0.2));

    revoluteJointSwingDoor = new f.ComponentJointRevolute(bodies[5].getComponent(f.ComponentRigidbody), bodies[6].getComponent(f.ComponentRigidbody), new f.Vector3(0, 1, 0), new f.Vector3(3.5, 2, -2));
    bodies[5].addComponent(revoluteJointSwingDoor);
    revoluteJointSwingDoor.motorLimitLower = -60;
    revoluteJointSwingDoor.motorLimitUpper = 60;

    //Cylindrical Joint
    bodies[7] = createCompleteMeshNode("Holder", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[7]);
    bodies[7].mtxLocal.translate(new f.Vector3(1.5, 3, -2));
    bodies[7].mtxLocal.scale(new f.Vector3(0.5, 1, 0.5));

    bodies[8] = createCompleteMeshNode("MovingDrill", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[8]);
    bodies[8].mtxLocal.translate(new f.Vector3(1.5, 2.5, -2));
    bodies[8].mtxLocal.scale(new f.Vector3(0.3, 2, 0.3));
    cylindricalJoint = new f.ComponentJointCylindrical(bodies[7].getComponent(f.ComponentRigidbody), bodies[8].getComponent(f.ComponentRigidbody), new f.Vector3(0, 1, 0), bodies[7].mtxLocal.translation);
    bodies[7].addComponent(cylindricalJoint);
    cylindricalJoint.translationMotorLimitLower = -1.25;
    cylindricalJoint.translationMotorLimitUpper = 0;
    cylindricalJoint.rotationalMotorLimitLower = 0;
    cylindricalJoint.rotationalMotorLimitUpper = 360;
    cylindricalJoint.rotationalMotorSpeed = 1;
    cylindricalJoint.rotationalMotorTorque = 10;

    //Spherical Joint
    bodies[9] = createCompleteMeshNode("Socket", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[9]);
    bodies[9].mtxLocal.translate(new f.Vector3(-1.5, 3, 2.5));
    bodies[9].mtxLocal.scale(new f.Vector3(0.5, 0.5, 0.5));

    bodies[10] = createCompleteMeshNode("BallJoint", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[10]);
    bodies[10].mtxLocal.translate(new f.Vector3(-1.5, 2, 2.5));
    bodies[10].mtxLocal.scale(new f.Vector3(0.3, 2, 0.3));
    sphericalJoint = new f.ComponentJointSpherical(bodies[9].getComponent(f.ComponentRigidbody), bodies[10].getComponent(f.ComponentRigidbody), new f.Vector3(-1.5, 3, 2.5));
    bodies[9].addComponent(sphericalJoint);

    //Universal Joint
    bodies[11] = createCompleteMeshNode("Holder", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[11]);
    bodies[11].mtxLocal.translate(new f.Vector3(-5.5, 5, 2.5));
    bodies[11].mtxLocal.scale(new f.Vector3(0.5, 0.5, 0.5));

    bodies[12] = createCompleteMeshNode("Universal1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[12]);
    bodies[12].mtxLocal.translate(new f.Vector3(-5.5, 3.75, 2.5));
    bodies[12].mtxLocal.scale(new f.Vector3(0.3, 2, 0.3));
    universalJoint = new f.ComponentJointUniversal(bodies[11].getComponent(f.ComponentRigidbody), bodies[12].getComponent(f.ComponentRigidbody), new f.Vector3(0, 1, 0), new f.Vector3(1, 0, 0), new f.Vector3(-5.5, 5, 2.5));
    bodies[11].addComponent(universalJoint);
    universalJoint.motorLimitLowerFirstAxis = 0;
    universalJoint.motorLimitUpperFirstAxis = 360;
    universalJoint.motorLimitLowerSecondAxis = 0;
    universalJoint.motorLimitUpperSecondAxis = 360;

    bodies[13] = createCompleteMeshNode("Universal2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(bodies[13]);
    bodies[13].mtxLocal.translate(new f.Vector3(-5.5, 1.75, 2.5));
    bodies[13].mtxLocal.scale(new f.Vector3(0.3, 2, 0.3));
    secondUniversalJoint = new f.ComponentJointUniversal(bodies[12].getComponent(f.ComponentRigidbody), bodies[13].getComponent(f.ComponentRigidbody), new f.Vector3(0, 1, 0), new f.Vector3(1, 0, 0), new f.Vector3(-5.5, 3, 2.5))
    bodies[12].addComponent(secondUniversalJoint);
    secondUniversalJoint.motorLimitLowerFirstAxis = 0;
    secondUniversalJoint.motorLimitUpperFirstAxis = 360;
    secondUniversalJoint.motorLimitLowerSecondAxis = 0;
    secondUniversalJoint.motorLimitUpperSecondAxis = 360;

    //Miscellaneous
    bodies[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    let cmpCubeTransform2: f.ComponentTransform = bodies[1].getComponent(f.ComponentTransform);
    hierarchy.appendChild(bodies[1]);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 2, 0));

    bodies[2] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
    let cmpCubeTransform3: f.ComponentTransform = bodies[2].getComponent(f.ComponentTransform);
    hierarchy.appendChild(bodies[2]);
    cmpCubeTransform3.local.translate(new f.Vector3(0.5, 3, 0.5));

    //Kinematic
    bodies[3] = createCompleteMeshNode("PlayerControlledCube", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0, 0, 1, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.KINEMATIC);
    moveableTransform = bodies[3].getComponent(f.ComponentTransform);
    hierarchy.appendChild(bodies[3]);
    moveableTransform.local.translate(new f.Vector3(-4, 1, 0));

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    cmpCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 17));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());


    viewPort = new f.Viewport();
    viewPort.initialize("Viewport", hierarchy, cmpCamera, app);

    viewPort.showSceneGraph();
    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);

    viewPort.activatePointerEvent(f.EVENT_POINTER.DOWN, true);
    viewPort.addEventListener(f.EVENT_POINTER.DOWN, hndPointerDown);
    viewPort.activatePointerEvent(f.EVENT_POINTER.UP, true);
    viewPort.addEventListener(f.EVENT_POINTER.UP, hndPointerUp);

    f.Physics.start(hierarchy);
    f.Loop.start();
  }

  function update(): void {
    f.Physics.world.simulate();
    viewPort.draw();
    measureFPS();
  }

  function measureFPS(): void {
    window.requestAnimationFrame(() => {
      const now: number = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      fpsDisplay.textContent = "FPS: " + fps.toString();
    });
  }

  function createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh, _mass: number, _physicsType: f.PHYSICS_TYPE, _group: f.PHYSICS_GROUP = f.PHYSICS_GROUP.DEFAULT): f.Node {
    let node: f.Node = new f.Node(_name);
    let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
    let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);

    let cmpTransform: f.ComponentTransform = new f.ComponentTransform();


    let cmpRigidbody: f.ComponentRigidbody = new f.ComponentRigidbody(_mass, _physicsType, f.COLLIDER_TYPE.CUBE, _group);
    cmpRigidbody.setRestitution(0.2);
    cmpRigidbody.setFriction(0.8);
    node.addComponent(cmpMesh);
    node.addComponent(cmpMaterial);
    node.addComponent(cmpTransform);
    node.addComponent(cmpRigidbody);
    return node;
  }

  function hndKey(_event: KeyboardEvent): void {
    let horizontal: number = 0;
    let vertical: number = 0;
    let height: number = 0;

    if (_event.code == f.KEYBOARD_CODE.A) {
      horizontal -= 1 * stepWidth;
    }
    if (_event.code == f.KEYBOARD_CODE.D) {
      horizontal += 1 * stepWidth;
    }
    if (_event.code == f.KEYBOARD_CODE.W) {
      vertical -= 1 * stepWidth;
    }
    if (_event.code == f.KEYBOARD_CODE.S) {
      vertical += 1 * stepWidth;
    }
    if (_event.code == f.KEYBOARD_CODE.S) {
      vertical += 1 * stepWidth;
    }
    if (_event.code == f.KEYBOARD_CODE.Q) {
      height += 1 * stepWidth;
    }
    if (_event.code == f.KEYBOARD_CODE.E) {
      height -= 1 * stepWidth;
    }
    let pos: f.Vector3 = moveableTransform.local.translation;
    pos.add(new f.Vector3(horizontal, height, vertical));
    moveableTransform.local.translation = pos;
  }

  function hndKeyDown(_event: KeyboardEvent): void { //Test for joint changes
    if (_event.code == f.KEYBOARD_CODE.Y) {
      prismaticJoint.attachedRigidbody.applyForce(new f.Vector3(0, 1 * 1000, 0));
    }
    if (_event.code == f.KEYBOARD_CODE.U) {
      prismaticJointSlide.connectedRigidbody.applyForce(new f.Vector3(1 * -100, 0, 0));
    }
    if (_event.code == f.KEYBOARD_CODE.I) {
      prismaticJointSlide.connectedRigidbody.applyForce(new f.Vector3(1 * 100, 0, 0));
    }
    if (_event.code == f.KEYBOARD_CODE.O) {
      revoluteJointSwingDoor.connectedRigidbody.applyForce(new f.Vector3(0, 0, 1 * 100));
    }
    if (_event.code == f.KEYBOARD_CODE.P) {
      revoluteJointSwingDoor.connectedRigidbody.applyForce(new f.Vector3(0, 0, 1 * -100));
    }
    if (_event.code == f.KEYBOARD_CODE.F) {
      cylindricalJoint.connectedRigidbody.applyForce(new f.Vector3(0, 1 * 300, 0));
    }
    if (_event.code == f.KEYBOARD_CODE.G) {
      sphericalJoint.connectedRigidbody.applyTorque(new f.Vector3(0, 1 * 100, 0));
    }
    if (_event.code == f.KEYBOARD_CODE.H) {
      secondUniversalJoint.connectedRigidbody.applyForce(new f.Vector3(0, 0, 1 * 100));
    }
  }

  function hndPointerDown(_event: f.EventPointer): void {
    let mouse: f.Vector2 = new f.Vector2(_event.pointerX, _event.pointerY);
    mouse.x = mouse.x / viewPort.getCanvasRectangle().width - 0.5;
    mouse.y = 0.5 - mouse.y / viewPort.getCanvasRectangle().height;
    let screenPos: f.Vector3 = new f.Vector3(mouse.x * viewPort.getCanvasRectangle().width, mouse.y * viewPort.getCanvasRectangle().height, 0);
    // f.Debug.log("ScreenPos: " + screenPos);
    let ingamePos: f.Vector3 = f.Vector3.TRANSFORMATION(screenPos, cmpCamera.ViewProjectionMatrix, false);
    ingamePos.normalize();

    // f.Debug.log("posIngame: " + ingamePos);

    let posProjection: f.Vector2 = viewPort.pointClientToProjection(mouse);
    let projection: f.Vector3 = cmpCamera.project(cmpCamera.pivot.translation);
    let posClient: f.Vector2 = viewPort.pointClipToClient(projection.toVector2());
    let posScreen: f.Vector2 = viewPort.pointClientToScreen(posClient);

    // f.Debug.log("posProj: " + posProjection);
    // f.Debug.log("camProj: " + projection);
    // f.Debug.log("posClient: " + posClient);
    // f.Debug.log("posScreen: " + posScreen);


    //Ray
    let origin: f.Vector3 = ingamePos; //cmpCamera.pivot.translation; //new f.Vector3(-posProjection.x * 2, posProjection.y * 2, 1.5);
    // origin.transform(cmpCamera.pivot, true);
    // f.Debug.log("Origin: " + origin);
    let end: f.Vector3 = new f.Vector3(posProjection.x, posProjection.y, 1);
    end.scale(200);
    let heading: f.Vector3 = origin.copy;
    heading.subtract(end);
    heading.x /= heading.magnitude;
    heading.y /= heading.magnitude;
    heading.z /= heading.magnitude;
    heading.z *= -1;
    // f.Debug.log("DirHead: " + heading);

    let endpoint: f.Vector3 = f.Vector3.ZERO();
    endpoint.add(origin);
    let endDirection: f.Vector3 = heading.copy;
    endDirection.scale(15);
    endpoint.add(endDirection);
    // f.Debug.log("Endpoint: " + endpoint);

    let dir: f.Vector3 = new f.Vector3(0, 0, 1);
    dir.transform(cmpCamera.pivot, false); //cmpCamera.ViewProjectionMatrix, false);
    dir.normalize();
    let hitInfo: f.RayHitInfo = f.Physics.raycast(origin, heading, 15);
    if (hitInfo.hit)
      f.Debug.log(hitInfo.rigidbodyComponent.getContainer().name);
    else
      f.Debug.log("miss");
    let pos: f.Vector3 = moveableTransform.local.translation;
    pos = hitInfo.hitPoint;
    moveableTransform.local.translation = pos;
  }

  function hndPointerUp(_event: f.EventPointer) {
  }

}