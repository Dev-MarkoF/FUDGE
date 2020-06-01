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

  let cubes: f.Node[] = new Array();
  let ground: f.Node;
  let cmpCamera: f.ComponentCamera;

  let stepWidth: number = 0.1;
  let moveableTransform: f.ComponentTransform;

  //Joints
  let prismaticJoint: f.ComponentJointPrismatic;
  let prismaticJointSlide: f.ComponentJointPrismatic;



  function init(_event: Event): void {
    f.Debug.log(app);
    f.RenderManager.initialize();
    f.Physics.initializePhysics();
    hierarchy = new f.Node("Scene");

    document.addEventListener("keypress", hndKey);
    document.addEventListener("keydown", hndKeyDown);

    ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube(), 0, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);
    cmpGroundMesh.local.scale(new f.Vector3(10, 0.3, 10));

    cmpGroundMesh.local.translate(new f.Vector3(0, -1.5, 0));
    hierarchy.appendChild(ground);

    //Prismatic Joints
    cubes[0] = createCompleteMeshNode("Spring_Floor", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_2);
    let cmpCubeTransform: f.ComponentTransform = cubes[0].getComponent(f.ComponentTransform);
    hierarchy.appendChild(cubes[0]);
    cmpCubeTransform.local.translate(new f.Vector3(0, 1, 0));
    cmpCubeTransform.local.scaleY(0.2);
    prismaticJoint = new f.ComponentJointPrismatic(cubes[0].getComponent(f.ComponentRigidbody), ground.getComponent(f.ComponentRigidbody));
    cubes[0].addComponent(prismaticJoint);
    prismaticJoint.springDamping = 0;
    prismaticJoint.springFrequency = 1;
    prismaticJoint.internalCollision = true;

    cubes[3] = createCompleteMeshNode("CubeJointBase", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0.4, 0.4, 0.4, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.STATIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(cubes[3]);
    cubes[3].mtxLocal.translate(new f.Vector3(-4, 2, -2));
    cubes[3].mtxLocal.scale(new f.Vector3(2, 0.5, 0.5));

    cubes[4] = createCompleteMeshNode("CubeJointSlide", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    hierarchy.appendChild(cubes[4]);
    cubes[4].mtxLocal.translate(new f.Vector3(-4, 2, -2));
    prismaticJointSlide = new f.ComponentJointPrismatic(cubes[3].getComponent(f.ComponentRigidbody), cubes[4].getComponent(f.ComponentRigidbody), new f.Vector3(1, 0, 0));
    cubes[3].addComponent(prismaticJointSlide);
    prismaticJointSlide.internalCollision = false;
    prismaticJointSlide.motorForce = 10;
    prismaticJointSlide.motorLimitLower = -1;
    prismaticJointSlide.motorLimitUpper = 1;


    //Miscellaneous
    cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 1, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC, f.PHYSICS_GROUP.GROUP_1);
    let cmpCubeTransform2: f.ComponentTransform = cubes[1].getComponent(f.ComponentTransform);
    hierarchy.appendChild(cubes[1]);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 2, 0));

    cubes[2] = createCompleteMeshNode("Cube_3", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.DYNAMIC);
    let cmpCubeTransform3: f.ComponentTransform = cubes[2].getComponent(f.ComponentTransform);
    hierarchy.appendChild(cubes[2]);
    cmpCubeTransform3.local.translate(new f.Vector3(0.5, 3, 0.5));

    //Kinematic
    cubes[3] = createCompleteMeshNode("PlayerControlledCube", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(0, 0, 1, 1))), new f.MeshCube(), 1, f.PHYSICS_TYPE.KINEMATIC);
    moveableTransform = cubes[3].getComponent(f.ComponentTransform);
    hierarchy.appendChild(cubes[3]);
    moveableTransform.local.translate(new f.Vector3(-4, 1, 0));

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    hierarchy.addComponent(cmpLight);

    cmpCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
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