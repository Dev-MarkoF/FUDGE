"use strict";
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="../Physics_Library/ammo.js"/>
let world;
Ammo().then(initializeAmmo);
function initializeAmmo() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(), dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration), overlappingPairCache = new Ammo.btDbvtBroadphase(), solver = new Ammo.btSequentialImpulseConstraintSolver();
    world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    world.setGravity(new Ammo.btVector3(0, -10, 0));
}
var FudgePhysics_Communication;
(function (FudgePhysics_Communication) {
    var f = FudgeCore;
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    let bodies = new Array();
    let ground;
    let cubeNo = 0;
    let time = 0;
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        hierarchy = new f.Node("Scene");
        ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(50, 0.3, 50));
        hierarchy.appendChild(ground);
        initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
        createRandomObject();
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 5, 25));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        //Physics Ammo
        world.setGravity(new Ammo.btVector3(0, -10, 0));
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
        applyPhysicsBody(ground.getComponent(f.ComponentTransform), 0);
        for (let i = 1; i < bodies.length; i++) { //Alle außer dem Grund
            applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
        }
        //EndPhysics
        time += f.Loop.timeFrameReal / 1000;
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
            fpsDisplay.textContent = "FPS: " + fps.toString() + " / Rigidbodies: " + bodies.length + " / Time: " + time.toFixed(2);
        });
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
    function createRandomObject() {
        let type = f.random.getRangeFloored(0, 2);
        let mesh = type == 0 ? new f.MeshCube() : new f.MeshSphere();
        cubes[cubeNo] = createCompleteMeshNode("Cube_" + cubeNo.toString(), new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), mesh);
        let cmpCubeTransform = cubes[cubeNo].getComponent(f.ComponentTransform);
        cmpCubeTransform.local.translate(new f.Vector3(0, 10, 0));
        hierarchy.appendChild(cubes[cubeNo]);
        initializePhysicsBody(cmpCubeTransform, 1, 1 + cubeNo, type);
        cubeNo++;
        setTimeout(createRandomObject, 100);
    }
    function initializePhysicsBody(_cmpTransform, massVal, no, type = 0) {
        let node = _cmpTransform.getContainer();
        let scale = new Ammo.btVector3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
        let pos = new Ammo.btVector3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
        let transform = new Ammo.btTransform();
        let quaternionRot = makeQuaternionFromRotation(node.mtxWorld.rotation.y, node.mtxWorld.rotation.x, node.mtxWorld.rotation.z);
        let rotation = new Ammo.btQuaternion(quaternionRot[0], quaternionRot[1], quaternionRot[2], quaternionRot[3]);
        transform.setIdentity();
        transform.setOrigin(pos);
        transform.setRotation(rotation);
        let shape;
        if (type == 0)
            shape = new Ammo.btBoxShape(scale);
        else
            shape = new Ammo.btSphereShape(0.5);
        shape.setMargin(0.05);
        let mass = massVal;
        let localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);
        let myMotionState = new Ammo.btDefaultMotionState(transform);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        bodies[no] = body;
        world.addRigidBody(body);
    }
    let transform = new Ammo.btTransform();
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
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFxRDtBQUNyRCxrREFBa0Q7QUFFbEQsSUFBSSxLQUFtQyxDQUFDO0FBRXhDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU1QixTQUFTLGNBQWM7SUFDckIsSUFBSSxzQkFBc0IsR0FBRyxJQUFJLElBQUksQ0FBQywrQkFBK0IsRUFBRSxFQUNyRSxVQUFVLEdBQUcsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsRUFDbkUsb0JBQW9CLEdBQUcsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFDbEQsTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLG1DQUFtQyxFQUFFLENBQUM7SUFFMUQsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUMzRyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsSUFBVSwwQkFBMEIsQ0FnTW5DO0FBaE1ELFdBQVUsMEJBQTBCO0lBQ2xDLElBQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUVyQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLElBQUksUUFBb0IsQ0FBQztJQUN6QixJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxHQUFXLENBQUM7SUFDaEIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxHQUFhLElB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QUM7UUFDakMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkIsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkIsSUFBSSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBRTFCLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUN4QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDeEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUV4QyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0FBSUgsQ0FBQyxFQWhNUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBZ01uQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuLy8vPHJlZmVyZW5jZSB0eXBlcz1cIi4uL1BoeXNpY3NfTGlicmFyeS9hbW1vLmpzXCIvPlxyXG5cclxubGV0IHdvcmxkOiBBbW1vLmJ0RGlzY3JldGVEeW5hbWljc1dvcmxkO1xyXG5cclxuQW1tbygpLnRoZW4oaW5pdGlhbGl6ZUFtbW8pO1xyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUFtbW8oKTogdm9pZCB7XHJcbiAgbGV0IGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24gPSBuZXcgQW1tby5idERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uKCksXHJcbiAgICBkaXNwYXRjaGVyID0gbmV3IEFtbW8uYnRDb2xsaXNpb25EaXNwYXRjaGVyKGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pLFxyXG4gICAgb3ZlcmxhcHBpbmdQYWlyQ2FjaGUgPSBuZXcgQW1tby5idERidnRCcm9hZHBoYXNlKCksXHJcbiAgICBzb2x2ZXIgPSBuZXcgQW1tby5idFNlcXVlbnRpYWxJbXB1bHNlQ29uc3RyYWludFNvbHZlcigpO1xyXG5cclxuICB3b3JsZCA9IG5ldyBBbW1vLmJ0RGlzY3JldGVEeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIG92ZXJsYXBwaW5nUGFpckNhY2hlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xyXG4gIHdvcmxkLnNldEdyYXZpdHkobmV3IEFtbW8uYnRWZWN0b3IzKDAsIC0xMCwgMCkpO1xyXG59XHJcblxyXG5uYW1lc3BhY2UgRnVkZ2VQaHlzaWNzX0NvbW11bmljYXRpb24ge1xyXG4gIGltcG9ydCBmID0gRnVkZ2VDb3JlO1xyXG5cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgaW5pdCk7XHJcbiAgY29uc3QgYXBwOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIik7XHJcbiAgbGV0IHZpZXdQb3J0OiBmLlZpZXdwb3J0O1xyXG4gIGxldCBoaWVyYXJjaHk6IGYuTm9kZTtcclxuICBsZXQgZnBzOiBudW1iZXI7XHJcbiAgY29uc3QgdGltZXM6IG51bWJlcltdID0gW107XHJcbiAgbGV0IGN1YmVzOiBmLk5vZGVbXSA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCBmcHNEaXNwbGF5OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJoMiNGUFNcIik7XHJcbiAgbGV0IGJvZGllcyA9IG5ldyBBcnJheSgpO1xyXG5cclxuICBsZXQgZ3JvdW5kOiBmLk5vZGU7XHJcbiAgbGV0IGN1YmVObzogbnVtYmVyID0gMDtcclxuICBsZXQgdGltZTogbnVtYmVyID0gMDtcclxuXHJcblxyXG4gIGZ1bmN0aW9uIGluaXQoX2V2ZW50OiBFdmVudCk6IHZvaWQge1xyXG4gICAgZi5EZWJ1Zy5sb2coYXBwKTtcclxuICAgIGYuUmVuZGVyTWFuYWdlci5pbml0aWFsaXplKCk7XHJcbiAgICBoaWVyYXJjaHkgPSBuZXcgZi5Ob2RlKFwiU2NlbmVcIik7XHJcblxyXG4gICAgZ3JvdW5kID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkdyb3VuZFwiLCBuZXcgZi5NYXRlcmlhbChcIkdyb3VuZFwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAuMiwgMC4yLCAwLjIsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCkpO1xyXG4gICAgbGV0IGNtcEdyb3VuZE1lc2g6IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gZ3JvdW5kLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcblxyXG4gICAgY21wR3JvdW5kTWVzaC5sb2NhbC5zY2FsZShuZXcgZi5WZWN0b3IzKDUwLCAwLjMsIDUwKSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoZ3JvdW5kKTtcclxuICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShncm91bmQuZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKSwgMCwgMCk7XHJcblxyXG4gICAgY3JlYXRlUmFuZG9tT2JqZWN0KCk7XHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCA1LCAyNSkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcbiAgICAvL1BoeXNpY3MgQW1tb1xyXG4gICAgd29ybGQuc2V0R3Jhdml0eShuZXcgQW1tby5idFZlY3RvcjMoMCwgLTEwLCAwKSk7XHJcblxyXG4gICAgLy9FbmRQaHlzaWNzXHJcblxyXG4gICAgdmlld1BvcnQgPSBuZXcgZi5WaWV3cG9ydCgpO1xyXG4gICAgdmlld1BvcnQuaW5pdGlhbGl6ZShcIlZpZXdwb3J0XCIsIGhpZXJhcmNoeSwgY21wQ2FtZXJhLCBhcHApO1xyXG5cclxuICAgIHZpZXdQb3J0LnNob3dTY2VuZUdyYXBoKCk7XHJcblxyXG4gICAgZi5Mb29wLmFkZEV2ZW50TGlzdGVuZXIoZi5FVkVOVC5MT09QX0ZSQU1FLCB1cGRhdGUpO1xyXG4gICAgZi5Mb29wLnN0YXJ0KGYuTE9PUF9NT0RFLlRJTUVfR0FNRSwgNjApO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvL1BoeXNpY3MgQW1tb1xyXG4gICAgd29ybGQuc3RlcFNpbXVsYXRpb24oZi5Mb29wLnRpbWVGcmFtZUdhbWUgLyAxMDAwKTtcclxuICAgIGFwcGx5UGh5c2ljc0JvZHkoZ3JvdW5kLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDApO1xyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMTsgaSA8IGJvZGllcy5sZW5ndGg7IGkrKykgeyAvL0FsbGUgYXXDn2VyIGRlbSBHcnVuZFxyXG4gICAgICBhcHBseVBoeXNpY3NCb2R5KGN1YmVzW2kgLSAxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pLCBpKTtcclxuICAgIH1cclxuICAgIC8vRW5kUGh5c2ljc1xyXG4gICAgdGltZSArPSBmLkxvb3AudGltZUZyYW1lUmVhbCAvIDEwMDA7XHJcblxyXG4gICAgdmlld1BvcnQuZHJhdygpO1xyXG4gICAgbWVhc3VyZUZQUygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWVhc3VyZUZQUygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgd2hpbGUgKHRpbWVzLmxlbmd0aCA+IDAgJiYgdGltZXNbMF0gPD0gbm93IC0gMTAwMCkge1xyXG4gICAgICAgIHRpbWVzLnNoaWZ0KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGltZXMucHVzaChub3cpO1xyXG4gICAgICBmcHMgPSB0aW1lcy5sZW5ndGg7XHJcbiAgICAgIGZwc0Rpc3BsYXkudGV4dENvbnRlbnQgPSBcIkZQUzogXCIgKyBmcHMudG9TdHJpbmcoKSArIFwiIC8gUmlnaWRib2RpZXM6IFwiICsgYm9kaWVzLmxlbmd0aCArIFwiIC8gVGltZTogXCIgKyB0aW1lLnRvRml4ZWQoMik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoX25hbWU6IHN0cmluZywgX21hdGVyaWFsOiBmLk1hdGVyaWFsLCBfbWVzaDogZi5NZXNoKTogZi5Ob2RlIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBuZXcgZi5Ob2RlKF9uYW1lKTtcclxuICAgIGxldCBjbXBNZXNoOiBmLkNvbXBvbmVudE1lc2ggPSBuZXcgZi5Db21wb25lbnRNZXNoKF9tZXNoKTtcclxuICAgIGxldCBjbXBNYXRlcmlhbDogZi5Db21wb25lbnRNYXRlcmlhbCA9IG5ldyBmLkNvbXBvbmVudE1hdGVyaWFsKF9tYXRlcmlhbCk7XHJcblxyXG4gICAgbGV0IGNtcFRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBuZXcgZi5Db21wb25lbnRUcmFuc2Zvcm0oKTtcclxuICAgIG5vZGUuYWRkQ29tcG9uZW50KGNtcE1lc2gpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWF0ZXJpYWwpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wVHJhbnNmb3JtKTtcclxuXHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVSYW5kb21PYmplY3QoKTogdm9pZCB7XHJcbiAgICBsZXQgdHlwZTogbnVtYmVyID0gZi5yYW5kb20uZ2V0UmFuZ2VGbG9vcmVkKDAsIDIpO1xyXG4gICAgbGV0IG1lc2g6IGYuTWVzaCA9IHR5cGUgPT0gMCA/IG5ldyBmLk1lc2hDdWJlKCkgOiBuZXcgZi5NZXNoU3BoZXJlKCk7XHJcbiAgICBjdWJlc1tjdWJlTm9dID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfXCIgKyBjdWJlTm8udG9TdHJpbmcoKSwgbmV3IGYuTWF0ZXJpYWwoXCJDdWJlXCIsIGYuU2hhZGVyRmxhdCwgbmV3IGYuQ29hdENvbG9yZWQobmV3IGYuQ29sb3IoMSwgMCwgMCwgMSkpKSwgbWVzaCk7XHJcbiAgICBsZXQgY21wQ3ViZVRyYW5zZm9ybTogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBjdWJlc1tjdWJlTm9dLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcbiAgICBjbXBDdWJlVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0ZShuZXcgZi5WZWN0b3IzKDAsIDEwLCAwKSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoY3ViZXNbY3ViZU5vXSk7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoY21wQ3ViZVRyYW5zZm9ybSwgMSwgMSArIGN1YmVObywgdHlwZSk7XHJcbiAgICBjdWJlTm8rKztcclxuXHJcbiAgICBzZXRUaW1lb3V0KGNyZWF0ZVJhbmRvbU9iamVjdCwgMTAwKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGluaXRpYWxpemVQaHlzaWNzQm9keShfY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSwgbWFzc1ZhbDogbnVtYmVyLCBubzogbnVtYmVyLCB0eXBlOiBudW1iZXIgPSAwKSB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuICAgIGxldCBzY2FsZTogQW1tby5idFZlY3RvcjMgPSBuZXcgQW1tby5idFZlY3RvcjMoX2NtcFRyYW5zZm9ybS5sb2NhbC5zY2FsaW5nLnggLyAyLCBfY21wVHJhbnNmb3JtLmxvY2FsLnNjYWxpbmcueSAvIDIsIF9jbXBUcmFuc2Zvcm0ubG9jYWwuc2NhbGluZy56IC8gMik7XHJcbiAgICBsZXQgcG9zOiBBbW1vLmJ0VmVjdG9yMyA9IG5ldyBBbW1vLmJ0VmVjdG9yMyhfY21wVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0aW9uLngsIF9jbXBUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb24ueSwgX2NtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGlvbi56KTtcclxuICAgIGxldCB0cmFuc2Zvcm06IEFtbW8uYnRUcmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xyXG4gICAgbGV0IHF1YXRlcm5pb25Sb3Q6IGFueSA9IG1ha2VRdWF0ZXJuaW9uRnJvbVJvdGF0aW9uKG5vZGUubXR4V29ybGQucm90YXRpb24ueSwgbm9kZS5tdHhXb3JsZC5yb3RhdGlvbi54LCBub2RlLm10eFdvcmxkLnJvdGF0aW9uLnopO1xyXG4gICAgbGV0IHJvdGF0aW9uOiBBbW1vLmJ0UXVhdGVybmlvbiA9IG5ldyBBbW1vLmJ0UXVhdGVybmlvbihxdWF0ZXJuaW9uUm90WzBdLCBxdWF0ZXJuaW9uUm90WzFdLCBxdWF0ZXJuaW9uUm90WzJdLCBxdWF0ZXJuaW9uUm90WzNdKTtcclxuICAgIHRyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xyXG4gICAgdHJhbnNmb3JtLnNldE9yaWdpbihwb3MpO1xyXG4gICAgdHJhbnNmb3JtLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcclxuICAgIGxldCBzaGFwZTogQW1tby5TaGFwZTtcclxuICAgIGlmICh0eXBlID09IDApXHJcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRCb3hTaGFwZShzY2FsZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRTcGhlcmVTaGFwZSgwLjUpO1xyXG5cclxuXHJcbiAgICBzaGFwZS5zZXRNYXJnaW4oMC4wNSk7XHJcbiAgICBsZXQgbWFzczogbnVtYmVyID0gbWFzc1ZhbDtcclxuICAgIGxldCBsb2NhbEluZXJ0aWE6IEFtbW8uYnRWZWN0b3IzID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xyXG4gICAgc2hhcGUuY2FsY3VsYXRlTG9jYWxJbmVydGlhKG1hc3MsIGxvY2FsSW5lcnRpYSk7XHJcbiAgICBsZXQgbXlNb3Rpb25TdGF0ZTogQW1tby5idERlZmF1bHRNb3Rpb25TdGF0ZSA9IG5ldyBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlKHRyYW5zZm9ybSk7XHJcbiAgICBsZXQgcmJJbmZvOiBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyhtYXNzLCBteU1vdGlvblN0YXRlLCBzaGFwZSwgbG9jYWxJbmVydGlhKTtcclxuICAgIGxldCBib2R5OiBBbW1vLmJ0UmlnaWRCb2R5ID0gbmV3IEFtbW8uYnRSaWdpZEJvZHkocmJJbmZvKTtcclxuICAgIGJvZGllc1tub10gPSBib2R5O1xyXG4gICAgd29ybGQuYWRkUmlnaWRCb2R5KGJvZHkpO1xyXG4gIH1cclxuXHJcbiAgbGV0IHRyYW5zZm9ybTogQW1tby5idFRyYW5zZm9ybSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XHJcbiAgZnVuY3Rpb24gYXBwbHlQaHlzaWNzQm9keShfY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSwgbm86IG51bWJlcik6IHZvaWQge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IF9jbXBUcmFuc2Zvcm0uZ2V0Q29udGFpbmVyKCk7XHJcblxyXG4gICAgbGV0IGJvZHkgPSBib2RpZXNbbm9dO1xyXG4gICAgYm9keS5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKHRyYW5zZm9ybSk7XHJcbiAgICAvL2JvZHkuc2V0TGluZWFyVmVsb2NpdHkobmV3IEFtbW8uYnRWZWN0b3IzKDEsIDAsIDApKTtcclxuXHJcbiAgICBsZXQgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xyXG4gICAgbGV0IHRtcFBvc2l0aW9uOiBmLlZlY3RvcjMgPSBuZXcgZi5WZWN0b3IzKG9yaWdpbi54KCksIG9yaWdpbi55KCksIG9yaWdpbi56KCkpO1xyXG4gICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XHJcbiAgICBsZXQgcm90UXVhdDogZi5RdWF0ZXJuaW9uID0gbmV3IGYuUXVhdGVybmlvbihyb3RhdGlvbi54KCksIHJvdGF0aW9uLnkoKSwgcm90YXRpb24ueigpLCByb3RhdGlvbi53KCkpO1xyXG5cclxuICAgIGxldCBtdXRhdG9yOiBmLk11dGF0b3IgPSB7fTtcclxuICAgIGxldCB0bXBSb3RhdGlvbjogZi5WZWN0b3IzID0gcm90UXVhdC50b0RlZ3JlZXMoKTtcclxuXHJcblxyXG4gICAgbXV0YXRvcltcInJvdGF0aW9uXCJdID0gdG1wUm90YXRpb247XHJcbiAgICBub2RlLm10eExvY2FsLm11dGF0ZShtdXRhdG9yKTtcclxuICAgIG11dGF0b3JbXCJ0cmFuc2xhdGlvblwiXSA9IHRtcFBvc2l0aW9uO1xyXG4gICAgbm9kZS5tdHhMb2NhbC5tdXRhdGUobXV0YXRvcik7XHJcblxyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIG1ha2VRdWF0ZXJuaW9uRnJvbVJvdGF0aW9uKHlhd1k6IG51bWJlciwgcGl0Y2hYOiBudW1iZXIsIHJvbGxaOiBudW1iZXIpOiBudW1iZXJbXSB7IC8vRnJvbSBDIyAuTmV0IFF1YXRlcm5pb24gQ2xhc3NcclxuICAgIC8vICBSb2xsIGZpcnN0LCBhYm91dCBheGlzIHRoZSBvYmplY3QgaXMgZmFjaW5nLCB0aGVuXHJcbiAgICAvLyAgcGl0Y2ggdXB3YXJkLCB0aGVuIHlhdyB0byBmYWNlIGludG8gdGhlIG5ldyBoZWFkaW5nXHJcbiAgICBsZXQgc3I6IG51bWJlciwgY3I6IG51bWJlciwgc3A6IG51bWJlciwgY3A6IG51bWJlciwgc3k6IG51bWJlciwgY3k6IG51bWJlcjtcclxuXHJcbiAgICBsZXQgaGFsZlJvbGw6IG51bWJlciA9IHJvbGxaICogMC41O1xyXG4gICAgc3IgPSBNYXRoLnNpbihoYWxmUm9sbCk7XHJcbiAgICBjciA9IE1hdGguY29zKGhhbGZSb2xsKTtcclxuXHJcbiAgICBsZXQgaGFsZlBpdGNoOiBudW1iZXIgPSBwaXRjaFggKiAwLjU7XHJcbiAgICBzcCA9IE1hdGguc2luKGhhbGZQaXRjaCk7XHJcbiAgICBjcCA9IE1hdGguY29zKGhhbGZQaXRjaCk7XHJcblxyXG4gICAgbGV0IGhhbGZZYXc6IG51bWJlciA9IHlhd1kgKiAwLjU7XHJcbiAgICBzeSA9IE1hdGguc2luKGhhbGZZYXcpO1xyXG4gICAgY3kgPSBNYXRoLmNvcyhoYWxmWWF3KTtcclxuXHJcbiAgICBsZXQgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xyXG5cclxuICAgIHJlc3VsdFswXSA9IGN5ICogc3AgKiBjciArIHN5ICogY3AgKiBzcjtcclxuICAgIHJlc3VsdFsxXSA9IHN5ICogY3AgKiBjciAtIGN5ICogc3AgKiBzcjtcclxuICAgIHJlc3VsdFsyXSA9IGN5ICogY3AgKiBzciAtIHN5ICogc3AgKiBjcjtcclxuICAgIHJlc3VsdFszXSA9IGN5ICogY3AgKiBjciArIHN5ICogc3AgKiBzcjtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcblxyXG5cclxufSJdfQ==