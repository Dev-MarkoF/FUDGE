namespace FudgeCore {


  /**
  * Main Physics Class to hold information about the physical representation of the scene
  * @author Marko Fehrenbach, HFU, 2020
  */
  export class Physics {

    public static world: Physics;

    private oimoWorld: OIMO.World;
    private bodyList: ComponentRigidbody[] = new Array();
    private triggerBodyList: ComponentRigidbody[] = new Array();

    /**
   * Creating a physical world to represent the [[Node]] Scene Tree
   */
    public static initializePhysics(): void {
      if (this.world == null) {
        this.world = new Physics();
        this.world.createWorld();
      }

    }

    /**
  * Cast a RAY into the physical world from a origin point in a certain direction. Receiving informations about the hit object and the
  * hit point.
  */
    public static raycast(_origin: Vector3, _direction: Vector3, _length: number = 1, _group: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT): RayHitInfo {
      let hitInfo: RayHitInfo = new RayHitInfo();
      let ray: OIMO.RayCastClosest = new OIMO.RayCastClosest();
      let begin: OIMO.Vec3 = new OIMO.Vec3(_origin.x, _origin.y, _origin.y);
      let end: OIMO.Vec3 = this.getRayEndPoint(begin, new Vector3(_direction.x, _direction.y, _direction.z), _length);
      ray.clear();
      if (_group == PHYSICS_GROUP.DEFAULT) { //Case 1: Raycasting the whole world, normal mode
        Physics.world.oimoWorld.rayCast(begin, end, ray);
      } else { //Raycasting on each body in a specific group
        let allHits: RayHitInfo[] = new Array();
        this.world.bodyList.forEach(function (value: ComponentRigidbody): void {
          if (value.collisionGroup == _group) {
            hitInfo = value.raycastThisBody(_origin, _direction, _length);
            if (hitInfo.hit == true) { //Every hit is could potentially be the closest
              allHits.push(hitInfo);
            }
          }
        });
        allHits.forEach(function (value: RayHitInfo): void { //get the closest hitInfo
          if (value.hitDistance < hitInfo.hitDistance || hitInfo.hit == false) {
            hitInfo = value;
          }
        });
      }
      if (ray.hit) {
        hitInfo.hit = true;
        hitInfo.hitPoint = new Vector3(ray.position.x, ray.position.y, ray.position.z);
        hitInfo.hitNormal = new Vector3(ray.normal.x, ray.normal.y, ray.normal.z);
        hitInfo.hitDistance = this.getRayDistance(_origin, hitInfo.hitPoint);
        hitInfo.rigidbodyComponent = ray.shape.userData;
      }
      return hitInfo;
    }


    /**
  * Starts the physical world by checking that each body has the correct values from transform
  */
    public static start(_sceneTree: Node): void {
      RenderManager.setupTransformAndLights(_sceneTree);
      this.world.updateWorldFromWorldMatrix();
    }

    private static getRayEndPoint(start: OIMO.Vec3, direction: Vector3, length: number): OIMO.Vec3 {
      let endpoint: Vector3 = Vector3.ZERO();
      endpoint.add(new Vector3(start.x, start.y, start.z));
      let endDirection: Vector3 = direction;
      endDirection.scale(length);
      endpoint.add(endDirection);
      return new OIMO.Vec3(endpoint.x, endpoint.y, endpoint.z);
    }

    private static getRayDistance(origin: Vector3, hitPoint: Vector3): number {
      let dx: number = origin.x - hitPoint.x;
      let dy: number = origin.y - hitPoint.y;
      let dz: number = origin.z - hitPoint.z;

      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }


    public getBodyList(): ComponentRigidbody[] {
      return this.bodyList;
    }

    public getTriggerList(): ComponentRigidbody[] {
      return this.triggerBodyList;
    }

    /**
  * Getting the solver iterations of the physics engine. Higher iteration numbers increase accuracy but decrease performance
  */
    public getSolverIterations(): number {
      return Physics.world.oimoWorld.getNumPositionIterations();
    }

    /**
  * Setting the solver iterations of the physics engine. Higher iteration numbers increase accuracy but decrease performance
  */
    public setSolverIterations(_value: number): void {
      Physics.world.oimoWorld.setNumPositionIterations(_value);
      Physics.world.oimoWorld.setNumVelocityIterations(_value);
    }

    /**
  * Get the applied gravitational force to physical objects. Default earth gravity = 9.81 m/s
  */
    public getGravity(): Vector3 {
      let tmpVec: OIMO.Vec3 = Physics.world.oimoWorld.getGravity();
      return new Vector3(tmpVec.x, tmpVec.y, tmpVec.z);
    }

    /**
  * Set the applied gravitational force to physical objects. Default earth gravity = 9.81 m/s
  */
    public setGravity(_value: Vector3): void {
      let tmpVec: OIMO.Vec3 = new OIMO.Vec3(_value.x, _value.y, _value.z);
      Physics.world.oimoWorld.setGravity(tmpVec);
    }

    /**
  * Adding a new OIMO Rigidbody to the OIMO World, happens automatically when adding a FUDGE Rigidbody Component
  */
    public addRigidbody(_rigidbody: OIMO.RigidBody, _cmpRB: ComponentRigidbody): void {
      this.bodyList.push(_cmpRB);
      Physics.world.oimoWorld.addRigidBody(_rigidbody);
    }

    /**
  * Removing a OIMO Rigidbody to the OIMO World, happens automatically when adding a FUDGE Rigidbody Component
  */
    public removeRigidbody(_rigidbody: OIMO.RigidBody, _cmpRB: ComponentRigidbody): void {
      let id: number = this.bodyList.indexOf(_cmpRB);
      this.bodyList.splice(id, 1);
      Physics.world.oimoWorld.removeRigidBody(_rigidbody);
    }

    /**
  * Simulates the physical world. _deltaTime is the amount of time between physical steps, default is 60 frames per second ~17ms
  */
    public simulate(_deltaTime: number = 1 / 60): void {
      Physics.world.oimoWorld.step(_deltaTime);
    }

    public checkEvents(): void {
      this.checkForTrigger();
    }

    private updateWorldFromWorldMatrix(): void {
      let bodiesToUpdate: ComponentRigidbody[] = new Array(); //Copy Array because removing/readding in the updateFromworld
      this.bodyList.forEach(function (value: ComponentRigidbody): void {
        bodiesToUpdate.push(value);
      });

      bodiesToUpdate.forEach(function (value: ComponentRigidbody): void {
        value.updateFromWorld();
      });
    }


    private createWorld(): void {
      Physics.world.oimoWorld = new OIMO.World();
    }

    //#region EVENTS
    //Trigger-Events - get every rb's in the trigger group, check each with every rb and if overlapping send event
    // private collidesWith(triggerRigidbody: OIMO.RigidBody, secondRigidbody: OIMO.RigidBody): boolean {
    //   let shape1: OIMO.Aabb = triggerRigidbody.getShapeList().getAabb();
    //   let shape2: OIMO.Aabb = secondRigidbody.getShapeList().getAabb();
    //   let colliding: boolean = shape1.overlap(shape2);
    //   return colliding;
    // }

    private checkForTrigger(): void {
      this.bodyList.forEach((value: ComponentRigidbody): void => {
        if (value.collisionGroup == PHYSICS_GROUP.TRIGGER) {
          this.triggerBodyList.push(value);
        }
      });
      // triggerBodies.forEach((value: ComponentRigidbody): void => {
      //   this.bodyList.forEach((_secondValue: ComponentRigidbody): void => {
      //     let triggered: boolean = this.collidesWith(value.getOimoRigidbody(), _secondValue.getOimoRigidbody());
      //     if (triggered) {
      //       _secondValue.reactToEvent(EVENT_PHYSICS.TRIGGER_ENTER, value);
      //     }
      //   });
      // });
    }

    //#endregion


  }


}