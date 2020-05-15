namespace FudgeCore {
  /**
 * Layers to place a node on, not every layer should collide with every layer 
 */
  export enum PHYSICS_LAYER { //TODO Give a possiblithy to set which layer collides with which, CollisionMatrix?
    DEFAULT = 0,
    STATIC = 1000,
    KINEMATIC = 2000,
    TRIGGER = 4000,
    LAYER_1 = 1,
    LAYER_2 = 2,
    LAYER_3 = 3,
    LAYER_4 = 4
  }

  /**
* Different Types of Physical Interaction, DYNAMIC is fully influenced by physics and only physics, STATIC means immovable, 
* KINEMATIC is only moved through physical code.
*/
  export enum PHYSICS_TYPE {
    DYNAMIC = OIMO.RigidBodyType.DYNAMIC,
    STATIC = OIMO.RigidBodyType.STATIC,
    KINEMATIC = OIMO.RigidBodyType.KINEMATIC
  }

  export enum COLLIDER_TYPE {
    BOX,
    SPHERE,
    CAPSULE,
    CYLINDER
  }

  export class RayHitInfo {
    public hitDistance: number;
    public hitPoint: Vector3;
    public rigidbodyComponent: ComponentRigidbody;
    public hitNormal: Vector3;
    public node: Node;

    constructor() {
      this.hitDistance = 0;
    }
  }

  /**
 * Main Physics Class to hold information about the physical representation of the scene
 * @author Marko Fehrenbach, HFU, 2020
 */
  export class Physics {

    public static world: Physics;

    private oimoWorld: OIMO.World;

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
    public static raycast(_origin: Vector3, _direction: Vector3, _length: number = 1, _hitInfo: RayHitInfo): RayHitInfo {
      //TODO-Optimization-Later: Implement Hit Layer Masks by ray specific objects on each layer (complex raycast maybe own function)
      _hitInfo = new RayHitInfo();
      let ray: OIMO.RayCastClosest = new OIMO.RayCastClosest();
      let begin: OIMO.Vec3 = new OIMO.Vec3(- 5, 0.3, 0);
      let end: OIMO.Vec3 = this.getRayEndPoint(new OIMO.Vec3(_origin.x, _origin.y, _origin.z), new Vector3(_direction.x, _direction.y, _direction.z), _length);

      ray.clear();
      Physics.world.oimoWorld.rayCast(begin, end, ray);
      if (ray.hit) {
        _hitInfo.hitPoint = new Vector3(ray.position.x, ray.position.y, ray.position.z);
        _hitInfo.hitNormal = new Vector3(ray.normal.x, ray.normal.y, ray.normal.z);
        _hitInfo.hitDistance = this.getRayDistance(_origin, _hitInfo.hitPoint);
        _hitInfo.rigidbodyComponent = ray.shape.userData;
        _hitInfo.node = _hitInfo.rigidbodyComponent.getContainer();
      }
      return _hitInfo;
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
    public addRigidbody(_rigidbody: OIMO.RigidBody): void {
      Physics.world.oimoWorld.addRigidBody(_rigidbody);
    }

    /**
 * Removing a OIMO Rigidbody to the OIMO World, happens automatically when adding a FUDGE Rigidbody Component
 */
    public removeRigidbody(_rigidbody: OIMO.RigidBody): void {
      Physics.world.oimoWorld.removeRigidBody(_rigidbody);
    }

    /**
 * Simulates the physical world. _deltaTime is the amount of time between physical steps, default is 60 frames per second ~17ms
 */
    public simulate(_deltaTime: number = 1 / 60): void {
      Physics.world.oimoWorld.step(_deltaTime);
    }

    private createWorld(): void {
      Physics.world.oimoWorld = new OIMO.World();
    }


  }


}