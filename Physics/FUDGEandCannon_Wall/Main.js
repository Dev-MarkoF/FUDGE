"use strict";
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="./Libraries/cannon.min.js"/>
var FudgePhysics_Communication;
///<reference types="../../Core/Build/FudgeCore.js"/>
///<reference types="./Libraries/cannon.min.js"/>
(function (FudgePhysics_Communication) {
    var f = FudgeCore;
    var c = CANNON;
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    let bodies = new Array();
    let bodiesNo = 0;
    let world = new c.World();
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(50, 0.3, 50));
        hierarchy.appendChild(ground);
        //CANNON Physics Ground/Settings
        world.gravity = new CANNON.Vec3(0, -9.81, 0);
        world.allowSleep = true;
        initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
        //Wall Creation
        let cubeNo = 0;
        for (let a = 0; a < 10; a++) {
            for (let b = 0; b < 10; b++) {
                cubes[cubeNo] = createCompleteMeshNode("Cube_" + cubeNo.toString(), new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
                //cubes[cubeNo].mtxWorld.rotateX(45);
                let cmpCubeTransform = cubes[cubeNo].getComponent(f.ComponentTransform);
                cmpCubeTransform.local.translate(new f.Vector3(-5 + b, a + 5, 0));
                hierarchy.appendChild(cubes[cubeNo]);
                //Physics
                f.Debug.log(cmpCubeTransform.getContainer().name);
                initializePhysicsBody(cmpCubeTransform, 1, 1 + cubeNo);
                cubeNo++;
            }
        }
        //EndWall Creation
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 5, 25));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);
    }
    function update() {
        //Physics CANNON
        world.step(f.Loop.timeFrameGame / 1000);
        for (let i = 1; i < bodies.length; i++) {
            applyPhysicsBody(cubes[i - 1].getComponent(f.ComponentTransform), i);
        }
        //EndPhysics
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
        let scale = new CANNON.Vec3(_cmpTransform.local.scaling.x / 2, _cmpTransform.local.scaling.y / 2, _cmpTransform.local.scaling.z / 2);
        let pos = new CANNON.Vec3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
        let rotation = new CANNON.Quaternion();
        rotation.setFromEuler(node.mtxWorld.rotation.x, node.mtxWorld.rotation.y, node.mtxWorld.rotation.z);
        let mat = new CANNON.Material();
        mat.friction = 1;
        mat.restitution = 0;
        bodies[no] = new CANNON.Body({
            mass: massVal,
            position: pos,
            quaternion: rotation,
            shape: new CANNON.Box(scale),
            material: mat,
            allowSleep: true,
            sleepSpeedLimit: 0.25,
            sleepTimeLimit: 1 // Body falls asleep after 1s of sleepiness
        });
        world.addBody(bodies[no]);
    }
    function applyPhysicsBody(_cmpTransform, no) {
        let node = _cmpTransform.getContainer();
        let tmpPosition = new f.Vector3(bodies[no].position.x, bodies[no].position.y, bodies[no].position.z);
        let mutator = {};
        let tmpRotation = makeRotationFromQuaternion(bodies[no].quaternion, node.mtxLocal.rotation);
        mutator["rotation"] = tmpRotation;
        node.mtxLocal.mutate(mutator);
        mutator["translation"] = tmpPosition;
        node.mtxLocal.mutate(mutator);
    }
    function makeRotationFromQuaternion(q, targetAxis = new f.Vector3(1, 1, 1)) {
        let angles = new f.Vector3();
        // roll (x-axis rotation)
        let sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
        let cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
        angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60; //*Framerate? //* 180;
        // pitch (y-axis rotation)
        let sinp = 2 * (q.w * q.y - q.z * q.x);
        if (Math.abs(sinp) >= 1)
            angles.y = copysign(Math.PI / 2, sinp) * 60; // use 90 degrees if out of range
        else
            angles.y = Math.asin(sinp) * 60;
        // yaw (z-axis rotation)
        let siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        let cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60;
        //f.Debug.log(angles);
        return angles;
    }
    function copysign(a, b) {
        return b < 0 ? -Math.abs(a) : Math.abs(a);
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFFakQsSUFBVSwwQkFBMEIsQ0FrTG5DO0FBckxELHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFFakQsV0FBVSwwQkFBMEI7SUFDbEMsSUFBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ3JCLElBQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQztJQUdsQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLElBQUksUUFBb0IsQ0FBQztJQUN6QixJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxHQUFXLENBQUM7SUFDaEIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxHQUFhLElBQUksS0FBSyxFQUFFLENBQUM7SUFDbEMsSUFBSSxVQUFVLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN6QixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7SUFFekIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFMUIsU0FBUyxJQUFJLENBQUMsTUFBYTtRQUN6QixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzdCLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEMsSUFBSSxNQUFNLEdBQVcsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FB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LENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUyxHQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakQsc0JBQXNCO1FBQ3RCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFHRCxTQUFTLFFBQVEsQ0FBQyxDQUFTLEVBQUUsQ0FBUztRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0FBRUgsQ0FBQyxFQWxMUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBa0xuQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgdHlwZXM9XCIuLi8uLi9Db3JlL0J1aWxkL0Z1ZGdlQ29yZS5qc1wiLz5cclxuLy8vPHJlZmVyZW5jZSB0eXBlcz1cIi4vTGlicmFyaWVzL2Nhbm5vbi5taW4uanNcIi8+XHJcblxyXG5uYW1lc3BhY2UgRnVkZ2VQaHlzaWNzX0NvbW11bmljYXRpb24ge1xyXG4gIGltcG9ydCBmID0gRnVkZ2VDb3JlO1xyXG4gIGltcG9ydCBjID0gQ0FOTk9OO1xyXG5cclxuXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGluaXQpO1xyXG4gIGNvbnN0IGFwcDogSFRNTENhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiY2FudmFzXCIpO1xyXG4gIGxldCB2aWV3UG9ydDogZi5WaWV3cG9ydDtcclxuICBsZXQgaGllcmFyY2h5OiBmLk5vZGU7XHJcbiAgbGV0IGZwczogbnVtYmVyO1xyXG4gIGNvbnN0IHRpbWVzOiBudW1iZXJbXSA9IFtdO1xyXG4gIGxldCBjdWJlczogZi5Ob2RlW10gPSBuZXcgQXJyYXkoKTtcclxuICBsZXQgZnBzRGlzcGxheTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiaDIjRlBTXCIpO1xyXG4gIGxldCBib2RpZXMgPSBuZXcgQXJyYXkoKTtcclxuICBsZXQgYm9kaWVzTm86IG51bWJlciA9IDA7XHJcblxyXG4gIGxldCB3b3JsZCA9IG5ldyBjLldvcmxkKCk7XHJcblxyXG4gIGZ1bmN0aW9uIGluaXQoX2V2ZW50OiBFdmVudCk6IHZvaWQge1xyXG4gICAgZi5EZWJ1Zy5sb2coYXBwKTtcclxuICAgIGYuUmVuZGVyTWFuYWdlci5pbml0aWFsaXplKCk7XHJcbiAgICBoaWVyYXJjaHkgPSBuZXcgZi5Ob2RlKFwiU2NlbmVcIik7XHJcblxyXG4gICAgbGV0IGdyb3VuZDogZi5Ob2RlID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkdyb3VuZFwiLCBuZXcgZi5NYXRlcmlhbChcIkdyb3VuZFwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDAuMiwgMC4yLCAwLjIsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCkpO1xyXG4gICAgbGV0IGNtcEdyb3VuZE1lc2g6IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gZ3JvdW5kLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSk7XHJcblxyXG4gICAgY21wR3JvdW5kTWVzaC5sb2NhbC5zY2FsZShuZXcgZi5WZWN0b3IzKDUwLCAwLjMsIDUwKSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoZ3JvdW5kKTtcclxuXHJcbiAgICAvL0NBTk5PTiBQaHlzaWNzIEdyb3VuZC9TZXR0aW5nc1xyXG4gICAgd29ybGQuZ3Jhdml0eSA9IG5ldyBDQU5OT04uVmVjMygwLCAtOS44MSwgMCk7XHJcbiAgICB3b3JsZC5hbGxvd1NsZWVwID0gdHJ1ZTtcclxuICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShncm91bmQuZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKSwgMCwgMCk7XHJcblxyXG5cclxuICAgIC8vV2FsbCBDcmVhdGlvblxyXG4gICAgbGV0IGN1YmVObyA9IDA7XHJcbiAgICBmb3IgKGxldCBhOiBudW1iZXIgPSAwOyBhIDwgMTA7IGErKykge1xyXG4gICAgICBmb3IgKGxldCBiOiBudW1iZXIgPSAwOyBiIDwgMTA7IGIrKykge1xyXG4gICAgICAgIGN1YmVzW2N1YmVOb10gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV9cIiArIGN1YmVOby50b1N0cmluZygpLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgICAgICAvL2N1YmVzW2N1YmVOb10ubXR4V29ybGQucm90YXRlWCg0NSk7XHJcbiAgICAgICAgbGV0IGNtcEN1YmVUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbY3ViZU5vXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgICAgIGNtcEN1YmVUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoLTUgKyBiLCBhICsgNSwgMCkpO1xyXG4gICAgICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1tjdWJlTm9dKTtcclxuICAgICAgICAvL1BoeXNpY3NcclxuICAgICAgICBmLkRlYnVnLmxvZyhjbXBDdWJlVHJhbnNmb3JtLmdldENvbnRhaW5lcigpLm5hbWUpO1xyXG4gICAgICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShjbXBDdWJlVHJhbnNmb3JtLCAxLCAxICsgY3ViZU5vKTtcclxuICAgICAgICBjdWJlTm8rKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy9FbmRXYWxsIENyZWF0aW9uXHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCA1LCAyNSkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcblxyXG4gICAgdmlld1BvcnQgPSBuZXcgZi5WaWV3cG9ydCgpO1xyXG4gICAgdmlld1BvcnQuaW5pdGlhbGl6ZShcIlZpZXdwb3J0XCIsIGhpZXJhcmNoeSwgY21wQ2FtZXJhLCBhcHApO1xyXG5cclxuICAgIHZpZXdQb3J0LnNob3dTY2VuZUdyYXBoKCk7XHJcblxyXG4gICAgZi5Mb29wLmFkZEV2ZW50TGlzdGVuZXIoZi5FVkVOVC5MT09QX0ZSQU1FLCB1cGRhdGUpO1xyXG4gICAgZi5Mb29wLnN0YXJ0KGYuTE9PUF9NT0RFLlRJTUVfR0FNRSwgNjApO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvL1BoeXNpY3MgQ0FOTk9OXHJcbiAgICB3b3JsZC5zdGVwKGYuTG9vcC50aW1lRnJhbWVHYW1lIC8gMTAwMCk7XHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAxOyBpIDwgYm9kaWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGFwcGx5UGh5c2ljc0JvZHkoY3ViZXNbaSAtIDFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIGkpO1xyXG4gICAgfVxyXG4gICAgLy9FbmRQaHlzaWNzXHJcblxyXG4gICAgdmlld1BvcnQuZHJhdygpO1xyXG4gICAgbWVhc3VyZUZQUygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWVhc3VyZUZQUygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgd2hpbGUgKHRpbWVzLmxlbmd0aCA+IDAgJiYgdGltZXNbMF0gPD0gbm93IC0gMTAwMCkge1xyXG4gICAgICAgIHRpbWVzLnNoaWZ0KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGltZXMucHVzaChub3cpO1xyXG4gICAgICBmcHMgPSB0aW1lcy5sZW5ndGg7XHJcbiAgICAgIGZwc0Rpc3BsYXkudGV4dENvbnRlbnQgPSBcIkZQUzogXCIgKyBmcHMudG9TdHJpbmcoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShfbmFtZTogc3RyaW5nLCBfbWF0ZXJpYWw6IGYuTWF0ZXJpYWwsIF9tZXNoOiBmLk1lc2gpOiBmLk5vZGUge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IG5ldyBmLk5vZGUoX25hbWUpO1xyXG4gICAgbGV0IGNtcE1lc2g6IGYuQ29tcG9uZW50TWVzaCA9IG5ldyBmLkNvbXBvbmVudE1lc2goX21lc2gpO1xyXG4gICAgbGV0IGNtcE1hdGVyaWFsOiBmLkNvbXBvbmVudE1hdGVyaWFsID0gbmV3IGYuQ29tcG9uZW50TWF0ZXJpYWwoX21hdGVyaWFsKTtcclxuXHJcbiAgICBsZXQgY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IG5ldyBmLkNvbXBvbmVudFRyYW5zZm9ybSgpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG5cclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBtYXNzVmFsOiBudW1iZXIsIG5vOiBudW1iZXIpIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBfY21wVHJhbnNmb3JtLmdldENvbnRhaW5lcigpO1xyXG4gICAgbGV0IHNjYWxlOiBDQU5OT04uVmVjMyA9IG5ldyBDQU5OT04uVmVjMyhfY21wVHJhbnNmb3JtLmxvY2FsLnNjYWxpbmcueCAvIDIsIF9jbXBUcmFuc2Zvcm0ubG9jYWwuc2NhbGluZy55IC8gMiwgX2NtcFRyYW5zZm9ybS5sb2NhbC5zY2FsaW5nLnogLyAyKTtcclxuICAgIGxldCBwb3M6IENBTk5PTi5WZWMzID0gbmV3IENBTk5PTi5WZWMzKF9jbXBUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb24ueCwgX2NtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGlvbi55LCBfY21wVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0aW9uLnopO1xyXG4gICAgbGV0IHJvdGF0aW9uOiBDQU5OT04uUXVhdGVybmlvbiA9IG5ldyBDQU5OT04uUXVhdGVybmlvbigpO1xyXG4gICAgcm90YXRpb24uc2V0RnJvbUV1bGVyKG5vZGUubXR4V29ybGQucm90YXRpb24ueCwgbm9kZS5tdHhXb3JsZC5yb3RhdGlvbi55LCBub2RlLm10eFdvcmxkLnJvdGF0aW9uLnopO1xyXG5cclxuICAgIGxldCBtYXQ6IENBTk5PTi5NYXRlcmlhbCA9IG5ldyBDQU5OT04uTWF0ZXJpYWwoKTtcclxuICAgIG1hdC5mcmljdGlvbiA9IDE7XHJcbiAgICBtYXQucmVzdGl0dXRpb24gPSAwO1xyXG5cclxuICAgIGJvZGllc1tub10gPSBuZXcgQ0FOTk9OLkJvZHkoe1xyXG4gICAgICBtYXNzOiBtYXNzVmFsLCAvLyBrZ1xyXG4gICAgICBwb3NpdGlvbjogcG9zLCAvLyBtXHJcbiAgICAgIHF1YXRlcm5pb246IHJvdGF0aW9uLFxyXG4gICAgICBzaGFwZTogbmV3IENBTk5PTi5Cb3goc2NhbGUpLFxyXG4gICAgICBtYXRlcmlhbDogbWF0LFxyXG4gICAgICBhbGxvd1NsZWVwOiB0cnVlLFxyXG4gICAgICBzbGVlcFNwZWVkTGltaXQ6IDAuMjUsIC8vIEJvZHkgd2lsbCBmZWVsIHNsZWVweSBpZiBzcGVlZDwxIChzcGVlZCA9PSBub3JtIG9mIHZlbG9jaXR5KVxyXG4gICAgICBzbGVlcFRpbWVMaW1pdDogMSAvLyBCb2R5IGZhbGxzIGFzbGVlcCBhZnRlciAxcyBvZiBzbGVlcGluZXNzXHJcbiAgICB9KTtcclxuICAgIHdvcmxkLmFkZEJvZHkoYm9kaWVzW25vXSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gYXBwbHlQaHlzaWNzQm9keShfY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSwgbm86IG51bWJlcik6IHZvaWQge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IF9jbXBUcmFuc2Zvcm0uZ2V0Q29udGFpbmVyKCk7XHJcbiAgICBsZXQgdG1wUG9zaXRpb246IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoYm9kaWVzW25vXS5wb3NpdGlvbi54LCBib2RpZXNbbm9dLnBvc2l0aW9uLnksIGJvZGllc1tub10ucG9zaXRpb24ueik7XHJcblxyXG4gICAgbGV0IG11dGF0b3I6IGYuTXV0YXRvciA9IHt9O1xyXG4gICAgbGV0IHRtcFJvdGF0aW9uOiBmLlZlY3RvcjMgPSBtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihib2RpZXNbbm9dLnF1YXRlcm5pb24sIG5vZGUubXR4TG9jYWwucm90YXRpb24pO1xyXG5cclxuICAgIG11dGF0b3JbXCJyb3RhdGlvblwiXSA9IHRtcFJvdGF0aW9uO1xyXG4gICAgbm9kZS5tdHhMb2NhbC5tdXRhdGUobXV0YXRvcik7XHJcbiAgICBtdXRhdG9yW1widHJhbnNsYXRpb25cIl0gPSB0bXBQb3NpdGlvbjtcclxuICAgIG5vZGUubXR4TG9jYWwubXV0YXRlKG11dGF0b3IpO1xyXG5cclxuICB9XHJcblxyXG5cclxuICBmdW5jdGlvbiBtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihxOiBhbnksIHRhcmdldEF4aXM6IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMoMSwgMSwgMSkpOiBmLlZlY3RvcjMge1xyXG4gICAgbGV0IGFuZ2xlczogZi5WZWN0b3IzID0gbmV3IGYuVmVjdG9yMygpO1xyXG5cclxuICAgIC8vIHJvbGwgKHgtYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW5yX2Nvc3A6IG51bWJlciA9IDIgKiAocS53ICogcS54ICsgcS55ICogcS56KTtcclxuICAgIGxldCBjb3NyX2Nvc3A6IG51bWJlciA9IDEgLSAyICogKHEueCAqIHEueCArIHEueSAqIHEueSk7XHJcbiAgICBhbmdsZXMueCA9IE1hdGguYXRhbjIoc2lucl9jb3NwLCBjb3NyX2Nvc3ApICogNjA7IC8vKkZyYW1lcmF0ZT8gLy8qIDE4MDtcclxuXHJcbiAgICAvLyBwaXRjaCAoeS1heGlzIHJvdGF0aW9uKVxyXG4gICAgbGV0IHNpbnA6IG51bWJlciA9IDIgKiAocS53ICogcS55IC0gcS56ICogcS54KTtcclxuICAgIGlmIChNYXRoLmFicyhzaW5wKSA+PSAxKVxyXG4gICAgICBhbmdsZXMueSA9IGNvcHlzaWduKE1hdGguUEkgLyAyLCBzaW5wKSAqIDYwOyAvLyB1c2UgOTAgZGVncmVlcyBpZiBvdXQgb2YgcmFuZ2VcclxuICAgIGVsc2VcclxuICAgICAgYW5nbGVzLnkgPSBNYXRoLmFzaW4oc2lucCkgKiA2MDtcclxuXHJcbiAgICAvLyB5YXcgKHotYXhpcyByb3RhdGlvbilcclxuICAgIGxldCBzaW55X2Nvc3A6IG51bWJlciA9IDIgKiAocS53ICogcS56ICsgcS54ICogcS55KTtcclxuICAgIGxldCBjb3N5X2Nvc3A6IG51bWJlciA9IDEgLSAyICogKHEueSAqIHEueSArIHEueiAqIHEueik7XHJcbiAgICBhbmdsZXMueiA9IE1hdGguYXRhbjIoc2lueV9jb3NwLCBjb3N5X2Nvc3ApICogNjA7XHJcbiAgICAvL2YuRGVidWcubG9nKGFuZ2xlcyk7XHJcbiAgICByZXR1cm4gYW5nbGVzO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGNvcHlzaWduKGE6IG51bWJlciwgYjogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBiIDwgMCA/IC1NYXRoLmFicyhhKSA6IE1hdGguYWJzKGEpO1xyXG4gIH1cclxuXHJcbn0iXX0=