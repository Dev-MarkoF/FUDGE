"use strict";
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/ammo.js"/>
var f = FudgeCore;
var Fudge_PysicsCommunication;
(function (Fudge_PysicsCommunication) {
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    //Physics Variables -> Can't be initialized until Ammo is loaded
    let world;
    let bodies = new Array();
    let transform;
    //Raycast Variables
    let tempVRayOrigin;
    let tempVRayDest;
    let closestRayResultCallback;
    //Materials
    let matHit = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0, 1, 0, 1)));
    let matHitOther = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0, 1, 0.7, 1)));
    let matNormal = new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1)));
    console.log("ran");
    initPhysics();
    let collisionConfiguration, dispatcher, overlappingPairCache, solver;
    function initPhysics() {
        transform = new Ammo.btTransform();
        tempVRayOrigin = new Ammo.btVector3(-5, 1.2, 0);
        tempVRayDest = new Ammo.btVector3(5, 1.2, 0);
        closestRayResultCallback = new Ammo.ClosestRayResultCallback(tempVRayOrigin, tempVRayDest);
        collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        overlappingPairCache = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        world.setGravity(new Ammo.btVector3(0, -10, 0));
        init();
    }
    function init() {
        f.Debug.log(app);
        f.RenderManager.initialize();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(20, 0.3, 20));
        hierarchy.appendChild(ground);
        cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform = cubes[0].getComponent(f.ComponentTransform);
        cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
        cubes[0].mtxWorld.rotateX(45);
        hierarchy.appendChild(cubes[0]);
        cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform2 = cubes[1].getComponent(f.ComponentTransform);
        cmpCubeTransform2.local.translate(new f.Vector3(0, 6.5, 0.4));
        hierarchy.appendChild(cubes[1]);
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
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
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);
    }
    function update() {
        //Physics Ammo
        world.stepSimulation(f.Loop.timeFrameGame / 1000);
        applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
        applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
        //EndPhysics
        raycast();
        viewPort.draw();
        measureFPS();
    }
    function measureFPS() {
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
    function raycast() {
        // Reset closestRayResultCallback to reuse it
        let rayCallBack = Ammo.castObject(closestRayResultCallback, Ammo.RayResultCallback);
        rayCallBack.set_m_closestHitFraction(1);
        rayCallBack.set_m_collisionObject(null);
        // Perform ray test
        world.rayTest(tempVRayOrigin, tempVRayDest, closestRayResultCallback);
        if (closestRayResultCallback.hasHit()) {
            let callbackBody = Ammo.castObject(closestRayResultCallback.get_m_collisionObject(), Ammo.btRigidBody);
            if (callbackBody == bodies[1]) {
                cubes[0].getComponent(f.ComponentMaterial).material = matHit;
            }
            else if (callbackBody == bodies[2]) {
                cubes[1].getComponent(f.ComponentMaterial).material = matHitOther;
            }
        }
        else {
            cubes[0].getComponent(f.ComponentMaterial).material = matNormal;
            cubes[1].getComponent(f.ComponentMaterial).material = matNormal;
        }
    }
    function createCompleteMeshNode(_name, _material, _mesh) {
        let node = new f.Node(_name);
        let cmpMesh = new f.ComponentMesh(_mesh);
        let cmpMaterial = new f.ComponentMaterial(_material);
        let cmpTransform = new f.ComponentTransform();
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
        return node;
    }
    function initializePhysicsBody(_cmpTransform, massVal, no) {
        let node = _cmpTransform.getContainer();
        let scale = new Ammo.btVector3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
        let pos = new Ammo.btVector3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
        let transform = new Ammo.btTransform();
        let quaternionRot = makeQuaternionFromRotation(node.mtxWorld.rotation.y, node.mtxWorld.rotation.x, node.mtxWorld.rotation.z);
        let rotation = new Ammo.btQuaternion(quaternionRot[0], quaternionRot[1], quaternionRot[2], quaternionRot[3]);
        transform.setIdentity();
        transform.setOrigin(pos);
        transform.setRotation(rotation);
        let shape = new Ammo.btBoxShape(scale);
        shape.setMargin(0.05);
        let mass = massVal;
        let localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);
        let myMotionState = new Ammo.btDefaultMotionState(transform);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
        rbInfo.m_restitution = 0.5;
        let body = new Ammo.btRigidBody(rbInfo);
        bodies[no] = body;
        world.addRigidBody(body);
    }
    function applyPhysicsBody(_cmpTransform, no) {
        let node = _cmpTransform.getContainer();
        let body = bodies[no];
        body.getMotionState().getWorldTransform(transform);
        //body.setLinearVelocity(new Ammo.btVector3(1, 0, 0));
        let origin = transform.getOrigin();
        let tmpPosition = new f.Vector3(origin.x(), origin.y(), origin.z());
        let rotation = transform.getRotation();
        let rotQuat = new f.Quaternion(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        let mutator = {};
        let tmpRotation = rotQuat.toDegrees();
        mutator["rotation"] = tmpRotation;
        node.mtxLocal.mutate(mutator);
        mutator["translation"] = tmpPosition;
        node.mtxLocal.mutate(mutator);
    }
    function makeQuaternionFromRotation(yawY, pitchX, rollZ) {
        //  Roll first, about axis the object is facing, then
        //  pitch upward, then yaw to face into the new heading
        let sr, cr, sp, cp, sy, cy;
        let halfRoll = rollZ * 0.5;
        sr = Math.sin(halfRoll);
        cr = Math.cos(halfRoll);
        let halfPitch = pitchX * 0.5;
        sp = Math.sin(halfPitch);
        cp = Math.cos(halfPitch);
        let halfYaw = yawY * 0.5;
        sy = Math.sin(halfYaw);
        cy = Math.cos(halfYaw);
        let result = [];
        result[0] = cy * sp * cr + sy * cp * sr;
        result[1] = sy * cp * cr - cy * sp * sr;
        result[2] = cy * cp * sr - sy * sp * cr;
        result[3] = cy * cp * cr + sy * sp * sr;
        return result;
    }
})(Fudge_PysicsCommunication || (Fudge_PysicsCommunication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFxRDtBQUNyRCxrREFBa0Q7QUFHbEQsSUFBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBRXJCLElBQVUseUJBQXlCLENBbVBsQztBQW5QRCxXQUFVLHlCQUF5QjtJQUdqQyxNQUFNLEdBQUcsR0FBc0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRSxJQUFJLFFBQW9CLENBQUM7SUFDekIsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksR0FBVyxDQUFDO0lBQ2hCLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUMzQixJQUFJLEtBQUssR0FBYSxJQUFJLEtBQUssRUFBRSxDQUFDO0lBQ2xDLElBQUksVUFBVSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRS9ELGdFQUFnRTtJQUNoRSxJQUFJLEtBQW1DLENBQUM7SUFDeEMsSUFBSSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN6QixJQUFJLFNBQTJCLENBQUM7SUFFaEMsbUJBQW1CO0lBQ25CLElBQUksY0FBOEIsQ0FBQztJQUNuQyxJQUFJLFlBQTRCLENBQUM7SUFDakMsSUFBSSx3QkFBdUQsQ0FBQztJQUU1RCxXQUFXO0lBQ1gsSUFBSSxNQUFNLEdBQWUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVHLElBQUksV0FBVyxHQUFlLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FB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QUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkIsSUFBSSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBRTFCLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDeEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUV4QyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0FBSUgsQ0FBQyxFQW5QUyx5QkFBeUIsS0FBekIseUJBQXlCLFFBbVBsQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuLy8vPHJlZmVyZW5jZSB0eXBlcz1cIi4uL1BoeXNpY3NfTGlicmFyeS9hbW1vLmpzXCIvPlxyXG5cclxuXHJcbmltcG9ydCBmID0gRnVkZ2VDb3JlO1xyXG5cclxubmFtZXNwYWNlIEZ1ZGdlX1B5c2ljc0NvbW11bmljYXRpb24ge1xyXG5cclxuXHJcbiAgY29uc3QgYXBwOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIik7XHJcbiAgbGV0IHZpZXdQb3J0OiBmLlZpZXdwb3J0O1xyXG4gIGxldCBoaWVyYXJjaHk6IGYuTm9kZTtcclxuICBsZXQgZnBzOiBudW1iZXI7XHJcbiAgY29uc3QgdGltZXM6IG51bWJlcltdID0gW107XHJcbiAgbGV0IGN1YmVzOiBmLk5vZGVbXSA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCBmcHNEaXNwbGF5OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJoMiNGUFNcIik7XHJcblxyXG4gIC8vUGh5c2ljcyBWYXJpYWJsZXMgLT4gQ2FuJ3QgYmUgaW5pdGlhbGl6ZWQgdW50aWwgQW1tbyBpcyBsb2FkZWRcclxuICBsZXQgd29ybGQ6IEFtbW8uYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQ7XHJcbiAgbGV0IGJvZGllcyA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCB0cmFuc2Zvcm06IEFtbW8uYnRUcmFuc2Zvcm07XHJcblxyXG4gIC8vUmF5Y2FzdCBWYXJpYWJsZXNcclxuICBsZXQgdGVtcFZSYXlPcmlnaW46IEFtbW8uYnRWZWN0b3IzO1xyXG4gIGxldCB0ZW1wVlJheURlc3Q6IEFtbW8uYnRWZWN0b3IzO1xyXG4gIGxldCBjbG9zZXN0UmF5UmVzdWx0Q2FsbGJhY2s6IEFtbW8uQ2xvc2VzdFJheVJlc3VsdENhbGxiYWNrO1xyXG5cclxuICAvL01hdGVyaWFsc1xyXG4gIGxldCBtYXRIaXQ6IGYuTWF0ZXJpYWwgPSBuZXcgZi5NYXRlcmlhbChcIkdyb3VuZFwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAsIDEsIDAsIDEpKSk7XHJcbiAgbGV0IG1hdEhpdE90aGVyOiBmLk1hdGVyaWFsID0gbmV3IGYuTWF0ZXJpYWwoXCJHcm91bmRcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigwLCAxLCAwLjcsIDEpKSk7XHJcbiAgbGV0IG1hdE5vcm1hbDogZi5NYXRlcmlhbCA9IG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKTtcclxuXHJcbiAgY29uc29sZS5sb2coXCJyYW5cIik7XHJcbiAgaW5pdFBoeXNpY3MoKTtcclxuXHJcbiAgbGV0IGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24sXHJcbiAgICBkaXNwYXRjaGVyLFxyXG4gICAgb3ZlcmxhcHBpbmdQYWlyQ2FjaGUsXHJcbiAgICBzb2x2ZXI7XHJcblxyXG5cclxuICBmdW5jdGlvbiBpbml0UGh5c2ljcygpOiB2b2lkIHtcclxuXHJcbiAgICB0cmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xyXG4gICAgdGVtcFZSYXlPcmlnaW4gPSBuZXcgQW1tby5idFZlY3RvcjMoLTUsIDEuMiwgMCk7XHJcbiAgICB0ZW1wVlJheURlc3QgPSBuZXcgQW1tby5idFZlY3RvcjMoNSwgMS4yLCAwKTtcclxuICAgIGNsb3Nlc3RSYXlSZXN1bHRDYWxsYmFjayA9IG5ldyBBbW1vLkNsb3Nlc3RSYXlSZXN1bHRDYWxsYmFjayh0ZW1wVlJheU9yaWdpbiwgdGVtcFZSYXlEZXN0KTtcclxuXHJcbiAgICBjb2xsaXNpb25Db25maWd1cmF0aW9uID0gbmV3IEFtbW8uYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpO1xyXG4gICAgZGlzcGF0Y2hlciA9IG5ldyBBbW1vLmJ0Q29sbGlzaW9uRGlzcGF0Y2hlcihjb2xsaXNpb25Db25maWd1cmF0aW9uKTtcclxuICAgIG92ZXJsYXBwaW5nUGFpckNhY2hlID0gbmV3IEFtbW8uYnREYnZ0QnJvYWRwaGFzZSgpO1xyXG4gICAgc29sdmVyID0gbmV3IEFtbW8uYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIoKTtcclxuXHJcbiAgICB3b3JsZCA9IG5ldyBBbW1vLmJ0RGlzY3JldGVEeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIG92ZXJsYXBwaW5nUGFpckNhY2hlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xyXG4gICAgd29ybGQuc2V0R3Jhdml0eShuZXcgQW1tby5idFZlY3RvcjMoMCwgLTEwLCAwKSk7XHJcblxyXG4gICAgaW5pdCgpO1xyXG5cclxuXHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGluaXQoKTogdm9pZCB7XHJcbiAgICBmLkRlYnVnLmxvZyhhcHApO1xyXG4gICAgZi5SZW5kZXJNYW5hZ2VyLmluaXRpYWxpemUoKTtcclxuICAgIGhpZXJhcmNoeSA9IG5ldyBmLk5vZGUoXCJTY2VuZVwiKTtcclxuXHJcbiAgICBsZXQgZ3JvdW5kOiBmLk5vZGUgPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiR3JvdW5kXCIsIG5ldyBmLk1hdGVyaWFsKFwiR3JvdW5kXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMC4yLCAwLjIsIDAuMiwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICBsZXQgY21wR3JvdW5kTWVzaDogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBncm91bmQuZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuXHJcbiAgICBjbXBHcm91bmRNZXNoLmxvY2FsLnNjYWxlKG5ldyBmLlZlY3RvcjMoMjAsIDAuMywgMjApKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChncm91bmQpO1xyXG5cclxuICAgIGN1YmVzWzBdID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfMVwiLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGN1YmVzWzBdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDIsIDApKTtcclxuICAgIGN1YmVzWzBdLm10eFdvcmxkLnJvdGF0ZVgoNDUpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGN1YmVzWzBdKTtcclxuXHJcbiAgICBjdWJlc1sxXSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJDdWJlXzJcIiwgbmV3IGYuTWF0ZXJpYWwoXCJDdWJlXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKSwgbmV3IGYuTWVzaEN1YmUoKSk7XHJcbiAgICBsZXQgY21wQ3ViZVRyYW5zZm9ybTI6IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbMV0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGNtcEN1YmVUcmFuc2Zvcm0yLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDYuNSwgMC40KSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoY3ViZXNbMV0pO1xyXG5cclxuICAgIGxldCBjbXBMaWdodDogZi5Db21wb25lbnRMaWdodCA9IG5ldyBmLkNvbXBvbmVudExpZ2h0KG5ldyBmLkxpZ2h0RGlyZWN0aW9uYWwoZi5Db2xvci5DU1MoXCJXSElURVwiKSkpO1xyXG4gICAgY21wTGlnaHQucGl2b3QubG9va0F0KG5ldyBmLlZlY3RvcjMoMC41LCAtMSwgLTAuOCkpO1xyXG4gICAgaGllcmFyY2h5LmFkZENvbXBvbmVudChjbXBMaWdodCk7XHJcblxyXG4gICAgbGV0IGNtcENhbWVyYTogZi5Db21wb25lbnRDYW1lcmEgPSBuZXcgZi5Db21wb25lbnRDYW1lcmEoKTtcclxuICAgIGNtcENhbWVyYS5iYWNrZ3JvdW5kQ29sb3IgPSBmLkNvbG9yLkNTUyhcIkdSRVlcIik7XHJcbiAgICBjbXBDYW1lcmEucGl2b3QudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMiwgMiwgMTApKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC5sb29rQXQoZi5WZWN0b3IzLlpFUk8oKSk7XHJcblxyXG4gICAgLy9QaHlzaWNzIEFtbW9cclxuICAgIHdvcmxkLnNldEdyYXZpdHkobmV3IEFtbW8uYnRWZWN0b3IzKDAsIC0xMCwgMCkpO1xyXG4gICAgaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCAwLCAwKTtcclxuICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShjbXBDdWJlVHJhbnNmb3JtLCAxLCAxKTtcclxuICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShjbXBDdWJlVHJhbnNmb3JtMiwgMSwgMik7XHJcbiAgICAvL0VuZFBoeXNpY3NcclxuXHJcbiAgICB2aWV3UG9ydCA9IG5ldyBmLlZpZXdwb3J0KCk7XHJcbiAgICB2aWV3UG9ydC5pbml0aWFsaXplKFwiVmlld3BvcnRcIiwgaGllcmFyY2h5LCBjbXBDYW1lcmEsIGFwcCk7XHJcblxyXG4gICAgdmlld1BvcnQuc2hvd1NjZW5lR3JhcGgoKTtcclxuXHJcbiAgICBmLkxvb3AuYWRkRXZlbnRMaXN0ZW5lcihmLkVWRU5ULkxPT1BfRlJBTUUsIHVwZGF0ZSk7XHJcbiAgICBmLkxvb3Auc3RhcnQoZi5MT09QX01PREUuVElNRV9HQU1FLCA2MCk7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlKCk6IHZvaWQge1xyXG5cclxuICAgIC8vUGh5c2ljcyBBbW1vXHJcbiAgICB3b3JsZC5zdGVwU2ltdWxhdGlvbihmLkxvb3AudGltZUZyYW1lR2FtZSAvIDEwMDApO1xyXG4gICAgYXBwbHlQaHlzaWNzQm9keShjdWJlc1swXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCAxKTtcclxuICAgIGFwcGx5UGh5c2ljc0JvZHkoY3ViZXNbMV0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKSwgMik7XHJcbiAgICAvL0VuZFBoeXNpY3NcclxuICAgIHJheWNhc3QoKTtcclxuICAgIHZpZXdQb3J0LmRyYXcoKTtcclxuICAgIG1lYXN1cmVGUFMoKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1lYXN1cmVGUFMoKTogdm9pZCB7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgICAgY29uc3Qgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgIHdoaWxlICh0aW1lcy5sZW5ndGggPiAwICYmIHRpbWVzWzBdIDw9IG5vdyAtIDEwMDApIHtcclxuICAgICAgICB0aW1lcy5zaGlmdCgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRpbWVzLnB1c2gobm93KTtcclxuICAgICAgZnBzID0gdGltZXMubGVuZ3RoO1xyXG4gICAgICBmcHNEaXNwbGF5LnRleHRDb250ZW50ID0gXCJGUFM6IFwiICsgZnBzLnRvU3RyaW5nKCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHJheWNhc3QoKSB7XHJcbiAgICAvLyBSZXNldCBjbG9zZXN0UmF5UmVzdWx0Q2FsbGJhY2sgdG8gcmV1c2UgaXRcclxuICAgIGxldCByYXlDYWxsQmFjayA9IEFtbW8uY2FzdE9iamVjdChjbG9zZXN0UmF5UmVzdWx0Q2FsbGJhY2ssIEFtbW8uUmF5UmVzdWx0Q2FsbGJhY2spO1xyXG4gICAgcmF5Q2FsbEJhY2suc2V0X21fY2xvc2VzdEhpdEZyYWN0aW9uKDEpO1xyXG4gICAgcmF5Q2FsbEJhY2suc2V0X21fY29sbGlzaW9uT2JqZWN0KG51bGwpO1xyXG5cclxuICAgIC8vIFBlcmZvcm0gcmF5IHRlc3RcclxuICAgIHdvcmxkLnJheVRlc3QodGVtcFZSYXlPcmlnaW4sIHRlbXBWUmF5RGVzdCwgY2xvc2VzdFJheVJlc3VsdENhbGxiYWNrKTtcclxuXHJcbiAgICBpZiAoY2xvc2VzdFJheVJlc3VsdENhbGxiYWNrLmhhc0hpdCgpKSB7XHJcbiAgICAgIGxldCBjYWxsYmFja0JvZHkgPSBBbW1vLmNhc3RPYmplY3QoY2xvc2VzdFJheVJlc3VsdENhbGxiYWNrLmdldF9tX2NvbGxpc2lvbk9iamVjdCgpLCBBbW1vLmJ0UmlnaWRCb2R5KTtcclxuICAgICAgaWYgKGNhbGxiYWNrQm9keSA9PSBib2RpZXNbMV0pIHtcclxuICAgICAgICBjdWJlc1swXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRNYXRlcmlhbCkubWF0ZXJpYWwgPSBtYXRIaXQ7XHJcbiAgICAgIH0gZWxzZSBpZiAoY2FsbGJhY2tCb2R5ID09IGJvZGllc1syXSkge1xyXG4gICAgICAgIGN1YmVzWzFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudE1hdGVyaWFsKS5tYXRlcmlhbCA9IG1hdEhpdE90aGVyO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY3ViZXNbMF0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50TWF0ZXJpYWwpLm1hdGVyaWFsID0gbWF0Tm9ybWFsO1xyXG4gICAgICBjdWJlc1sxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRNYXRlcmlhbCkubWF0ZXJpYWwgPSBtYXROb3JtYWw7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShfbmFtZTogc3RyaW5nLCBfbWF0ZXJpYWw6IGYuTWF0ZXJpYWwsIF9tZXNoOiBmLk1lc2gpOiBmLk5vZGUge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IG5ldyBmLk5vZGUoX25hbWUpO1xyXG4gICAgbGV0IGNtcE1lc2g6IGYuQ29tcG9uZW50TWVzaCA9IG5ldyBmLkNvbXBvbmVudE1lc2goX21lc2gpO1xyXG4gICAgbGV0IGNtcE1hdGVyaWFsOiBmLkNvbXBvbmVudE1hdGVyaWFsID0gbmV3IGYuQ29tcG9uZW50TWF0ZXJpYWwoX21hdGVyaWFsKTtcclxuXHJcbiAgICBsZXQgY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IG5ldyBmLkNvbXBvbmVudFRyYW5zZm9ybSgpO1xyXG5cclxuICAgIG5vZGUuYWRkQ29tcG9uZW50KGNtcE1lc2gpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWF0ZXJpYWwpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wVHJhbnNmb3JtKTtcclxuXHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGluaXRpYWxpemVQaHlzaWNzQm9keShfY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSwgbWFzc1ZhbDogbnVtYmVyLCBubzogbnVtYmVyKSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCBzY2FsZTogQW1tby5idFZlY3RvcjMgPSBuZXcgQW1tby5idFZlY3RvcjMoX2NtcFRyYW5zZm9ybS5sb2NhbC5zY2FsaW5nLnggLyAyLCBfY21wVHJhbnNmb3JtLmxvY2FsLnNjYWxpbmcueSAvIDIsIF9jbXBUcmFuc2Zvcm0ubG9jYWwuc2NhbGluZy56IC8gMik7XHJcbiAgICBsZXQgcG9zOiBBbW1vLmJ0VmVjdG9yMyA9IG5ldyBBbW1vLmJ0VmVjdG9yMyhfY21wVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0aW9uLngsIF9jbXBUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb24ueSwgX2NtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGlvbi56KTtcclxuICAgIGxldCB0cmFuc2Zvcm06IEFtbW8uYnRUcmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xyXG4gICAgbGV0IHF1YXRlcm5pb25Sb3Q6IGFueSA9IG1ha2VRdWF0ZXJuaW9uRnJvbVJvdGF0aW9uKG5vZGUubXR4V29ybGQucm90YXRpb24ueSwgbm9kZS5tdHhXb3JsZC5yb3RhdGlvbi54LCBub2RlLm10eFdvcmxkLnJvdGF0aW9uLnopO1xyXG4gICAgbGV0IHJvdGF0aW9uOiBBbW1vLmJ0UXVhdGVybmlvbiA9IG5ldyBBbW1vLmJ0UXVhdGVybmlvbihxdWF0ZXJuaW9uUm90WzBdLCBxdWF0ZXJuaW9uUm90WzFdLCBxdWF0ZXJuaW9uUm90WzJdLCBxdWF0ZXJuaW9uUm90WzNdKTtcclxuICAgIHRyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xyXG4gICAgdHJhbnNmb3JtLnNldE9yaWdpbihwb3MpO1xyXG4gICAgdHJhbnNmb3JtLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcclxuICAgIGxldCBzaGFwZTogQW1tby5idEJveFNoYXBlID0gbmV3IEFtbW8uYnRCb3hTaGFwZShzY2FsZSk7XHJcbiAgICBzaGFwZS5zZXRNYXJnaW4oMC4wNSk7XHJcbiAgICBsZXQgbWFzczogbnVtYmVyID0gbWFzc1ZhbDtcclxuICAgIGxldCBsb2NhbEluZXJ0aWE6IEFtbW8uYnRWZWN0b3IzID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xyXG4gICAgc2hhcGUuY2FsY3VsYXRlTG9jYWxJbmVydGlhKG1hc3MsIGxvY2FsSW5lcnRpYSk7XHJcbiAgICBsZXQgbXlNb3Rpb25TdGF0ZTogQW1tby5idERlZmF1bHRNb3Rpb25TdGF0ZSA9IG5ldyBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlKHRyYW5zZm9ybSk7XHJcbiAgICBsZXQgcmJJbmZvOiBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyhtYXNzLCBteU1vdGlvblN0YXRlLCBzaGFwZSwgbG9jYWxJbmVydGlhKTtcclxuICAgIHJiSW5mby5tX3Jlc3RpdHV0aW9uID0gMC41O1xyXG4gICAgbGV0IGJvZHk6IEFtbW8uYnRSaWdpZEJvZHkgPSBuZXcgQW1tby5idFJpZ2lkQm9keShyYkluZm8pO1xyXG4gICAgYm9kaWVzW25vXSA9IGJvZHk7XHJcbiAgICB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhcHBseVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBubzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuXHJcbiAgICBsZXQgYm9keSA9IGJvZGllc1tub107XHJcbiAgICBib2R5LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0odHJhbnNmb3JtKTtcclxuICAgIC8vYm9keS5zZXRMaW5lYXJWZWxvY2l0eShuZXcgQW1tby5idFZlY3RvcjMoMSwgMCwgMCkpO1xyXG5cclxuICAgIGxldCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XHJcbiAgICBsZXQgdG1wUG9zaXRpb246IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMob3JpZ2luLngoKSwgb3JpZ2luLnkoKSwgb3JpZ2luLnooKSk7XHJcbiAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcclxuXHJcbiAgICBsZXQgcm90UXVhdDogZi5RdWF0ZXJuaW9uID0gbmV3IGYuUXVhdGVybmlvbihyb3RhdGlvbi54KCksIHJvdGF0aW9uLnkoKSwgcm90YXRpb24ueigpLCByb3RhdGlvbi53KCkpO1xyXG5cclxuICAgIGxldCBtdXRhdG9yOiBmLk11dGF0b3IgPSB7fTtcclxuICAgIGxldCB0bXBSb3RhdGlvbjogZi5WZWN0b3IzID0gcm90UXVhdC50b0RlZ3JlZXMoKTtcclxuXHJcbiAgICBtdXRhdG9yW1wicm90YXRpb25cIl0gPSB0bXBSb3RhdGlvbjtcclxuICAgIG5vZGUubXR4TG9jYWwubXV0YXRlKG11dGF0b3IpO1xyXG4gICAgbXV0YXRvcltcInRyYW5zbGF0aW9uXCJdID0gdG1wUG9zaXRpb247XHJcbiAgICBub2RlLm10eExvY2FsLm11dGF0ZShtdXRhdG9yKTtcclxuXHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gbWFrZVF1YXRlcm5pb25Gcm9tUm90YXRpb24oeWF3WTogbnVtYmVyLCBwaXRjaFg6IG51bWJlciwgcm9sbFo6IG51bWJlcik6IG51bWJlcltdIHsgLy9Gcm9tIEMjIC5OZXQgUXVhdGVybmlvbiBDbGFzc1xyXG4gICAgLy8gIFJvbGwgZmlyc3QsIGFib3V0IGF4aXMgdGhlIG9iamVjdCBpcyBmYWNpbmcsIHRoZW5cclxuICAgIC8vICBwaXRjaCB1cHdhcmQsIHRoZW4geWF3IHRvIGZhY2UgaW50byB0aGUgbmV3IGhlYWRpbmdcclxuICAgIGxldCBzcjogbnVtYmVyLCBjcjogbnVtYmVyLCBzcDogbnVtYmVyLCBjcDogbnVtYmVyLCBzeTogbnVtYmVyLCBjeTogbnVtYmVyO1xyXG5cclxuICAgIGxldCBoYWxmUm9sbDogbnVtYmVyID0gcm9sbFogKiAwLjU7XHJcbiAgICBzciA9IE1hdGguc2luKGhhbGZSb2xsKTtcclxuICAgIGNyID0gTWF0aC5jb3MoaGFsZlJvbGwpO1xyXG5cclxuICAgIGxldCBoYWxmUGl0Y2g6IG51bWJlciA9IHBpdGNoWCAqIDAuNTtcclxuICAgIHNwID0gTWF0aC5zaW4oaGFsZlBpdGNoKTtcclxuICAgIGNwID0gTWF0aC5jb3MoaGFsZlBpdGNoKTtcclxuXHJcbiAgICBsZXQgaGFsZllhdzogbnVtYmVyID0geWF3WSAqIDAuNTtcclxuICAgIHN5ID0gTWF0aC5zaW4oaGFsZllhdyk7XHJcbiAgICBjeSA9IE1hdGguY29zKGhhbGZZYXcpO1xyXG5cclxuICAgIGxldCByZXN1bHQ6IG51bWJlcltdID0gW107XHJcblxyXG4gICAgcmVzdWx0WzBdID0gY3kgKiBzcCAqIGNyICsgc3kgKiBjcCAqIHNyO1xyXG4gICAgcmVzdWx0WzFdID0gc3kgKiBjcCAqIGNyIC0gY3kgKiBzcCAqIHNyO1xyXG4gICAgcmVzdWx0WzJdID0gY3kgKiBjcCAqIHNyIC0gc3kgKiBzcCAqIGNyO1xyXG4gICAgcmVzdWx0WzNdID0gY3kgKiBjcCAqIGNyICsgc3kgKiBzcCAqIHNyO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuXHJcblxyXG59XHJcbiJdfQ==