namespace FudgeCore {
  export const enum EVENT_PHYSICS {
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    TRIGGER_ENTER = "TriggerEnteredCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    TRIGGER_LEAVE = "TriggerLeftCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    COLLISION_ENTER = "ColliderEnteredCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    COLLISION_LEAVE = "ColliderLeftCollision",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    RAYCAST_HIT = "RigidbodyWasHitByRay",
    /** broadcast to a [[Node]] and all [[Nodes]] in the branch it's the root of */
    INITIALIZE = "Initialized"
  }
}