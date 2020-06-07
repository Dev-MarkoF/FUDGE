namespace FudgeCore {
  export const enum EVENT_PHYSICS {
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    TRIGGER_ENTER = "TriggerEnteredCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    TRIGGER_EXIT = "TriggerLeftCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    COLLISION_ENTER = "ColliderEnteredCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    COLLISION_EXIT = "ColliderLeftCollision"
  }

  export class EventPhysics extends Event {
    /**
     * ComponentRigidbody that collided with this ComponentRigidbody
     */
    public cmpRigidbody: ComponentRigidbody;
    /**
     * The normal impulse between the two colliding objects. Normal represents the default impulse.
     * Impulse is only happening on COLLISION_ENTER, so there is no impulse on exit nor on triggers.
     * Use the velocity of the cmpRigidbody to determine the intensity of the EVENT instead.
     */
    public normalImpulse: number;
    public tangentImpulse: number;
    public binomalImpulse: number;
    /** The point where the collision/triggering initially happened. The collision point exists only on COLLISION_ENTER / TRIGGER_ENTER. */
    public collisionPoint: Vector3;

    constructor(_type: EVENT_PHYSICS, _hitRigidbody: ComponentRigidbody, _normalImpulse: number, _tangentImpulse: number, _binormalImpulse: number, _collisionPoint: Vector3 = null) {
      super(_type);
      this.cmpRigidbody = _hitRigidbody;
      this.normalImpulse = _normalImpulse;
      this.tangentImpulse = _tangentImpulse;
      this.binomalImpulse = _binormalImpulse;
      this.collisionPoint = _collisionPoint;
    }
  }

  /**
* Groups to place a node in, not every group should collide with every group. Use a Mask in to exclude collisions
*/
  export enum PHYSICS_GROUP { //TODO Give a possiblithy to set which layer collides with which, CollisionMatrix?
    DEFAULT = 1,
    TRIGGER = 60000,
    GROUP_1 = 2,
    GROUP_2 = 4,
    GROUP_3 = 8,
    GROUP_4 = 16
  }

  /**
  * Different types of physical interaction, DYNAMIC is fully influenced by physics and only physics, STATIC means immovable, 
  * KINEMATIC is moved through transform and animation instead of physics code.
  */
  export enum PHYSICS_TYPE {
    DYNAMIC = 1, // = OIMO.RigidBodyType.DYNAMIC,
    STATIC = 2, // = OIMO.RigidBodyType.STATIC,
    KINEMATIC = 3 // = OIMO.RigidBodyType.KINEMATIC
  }

  /**
  * Different types of collider shapes, with different options in scaling BOX = Vector3(length, height, depth),
  * SPHERE = Vector3(diameter, x, x), CAPSULE = Vector3(diameter, height, x), CYLINDER = Vector3(diameter, height, x),
  * CONE = Vector(diameter, height, x); x == unused.
  */
  export enum COLLIDER_TYPE {
    CUBE,
    SPHERE,
    CAPSULE,
    CYLINDER,
    CONE
    //Note: Convex Hull could be added but that would need to have the vertices of a object and created differently. But Oimo supports it
  }

  export class RayHitInfo {
    public hit: boolean;
    public hitDistance: number;
    public hitPoint: Vector3;
    public rigidbodyComponent: ComponentRigidbody;
    public hitNormal: Vector3;

    constructor() {
      this.hit = false;
      this.hitDistance = 0;
      this.hitPoint = Vector3.ZERO();
      this.hitNormal = Vector3.ZERO();
    }
  }
}