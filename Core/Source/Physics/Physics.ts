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

  /**
 * Main Physics Class to hold information about the physical representation of the scene
 * @author Marko Fehrenbach, HFU, 2020
 */
  export class Physics {

    public static instance: Physics;

    public world: OIMO.World;

    /**
   * Creating a physical world to represent the [[Node]] Scene Tree
   */
    public static initializePhysics(): void {
      if (this.instance == null) {
        this.instance = new Physics();
        this.instance.createWorld();
      }

    }

    /**
 * Getting the solver iterations of the physics engine. Higher iteration numbers increase accuracy but decrease performance
 */
    public getSolverIterations(): number {
      return Physics.instance.world.getNumPositionIterations();
    }

    /**
* Setting the solver iterations of the physics engine. Higher iteration numbers increase accuracy but decrease performance
*/
    public setSolverIterations(_value: number): void {
      Physics.instance.world.setNumPositionIterations(_value);
      Physics.instance.world.setNumVelocityIterations(_value);
    }

    /**
* Get the applied gravitational force to physical objects. Default earth gravity = 9.81 m/s
*/
    public getGravity(): Vector3 {
      let tmpVec: OIMO.Vec3 = Physics.instance.world.getGravity();
      return new Vector3(tmpVec.x, tmpVec.y, tmpVec.z);
    }

    /**
* Set the applied gravitational force to physical objects. Default earth gravity = 9.81 m/s
*/
    public setGravity(_value: Vector3): void {
      let tmpVec: OIMO.Vec3 = new OIMO.Vec3(_value.x, _value.y, _value.z);
      Physics.instance.world.setGravity(tmpVec);
    }

    /**
  * Adding a new OIMO Rigidbody to the OIMO World, happens automatically when adding a FUDGE Rigidbody Component
  */
    public addRigidbody(_rigidbody: OIMO.RigidBody): void {
      Physics.instance.world.addRigidBody(_rigidbody);
    }

    /**
 * Removing a OIMO Rigidbody to the OIMO World, happens automatically when adding a FUDGE Rigidbody Component
 */
    public removeRigidbody(_rigidbody: OIMO.RigidBody): void {
      Physics.instance.world.removeRigidBody(_rigidbody);
    }

    /**
 * Simulates the physical world. _deltaTime is the amount of time between physical steps, default is 60 frames per second ~17ms
 */
    public simulate(_deltaTime: number = 1 / 60): void {
      Physics.instance.world.step(_deltaTime);
    }

    private createWorld(): void {
      Physics.instance.world = new OIMO.World();
    }

  }
}