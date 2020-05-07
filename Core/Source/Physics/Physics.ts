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
 * Main Physics Class to hold information about the physical representation of the scene
 * @author Marko Fehrenbach, HFU, 2020
 */
  export class PhysicsWorld {
    public static instance: PhysicsWorld;

    /**
   * Creating a physical world to represent the [[Node]] Scene Tree
   */
    public static initializePhysics(): void {
      if (this.instance == null) {
        this.instance = new PhysicsWorld();
      }
      //Implement Settings for Solver Iterations, Gravitation and such
    }

    //TODO: Functions for Raycast, Check for Specific Collision, Set/Get Values like Gravity, Add/Remove Rigidbody, Springs and more
  }
}