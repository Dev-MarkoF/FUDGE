///<reference path="../../../Physics/OIMOPhysics.d.ts"/>

namespace FudgeCore {
  /**
     * Acts as the physical representation of the [[Node]] it's attached to.
     * It's the connection between the Fudge Rendered World and the Physics World
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentRigidbody extends Component {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentRigidbody);

    private rigidbody: OIMO.RigidBody;
    private massData: OIMO.MassData;
    private collider: OIMO.Shape;
    private colliderType: COLLIDER_TYPE;
    private colliderInfo: OIMO.ShapeConfig;
    private rigidbodyInfo: OIMO.RigidBodyConfig;

    constructor(_mass: number = 1, _type: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC, _colliderType: COLLIDER_TYPE = COLLIDER_TYPE.BOX, _transform: ComponentTransform = null) {
      super();
      this.createRigidbody(_mass, _type, _colliderType, _transform);
      this.addEventListener(EVENT.COMPONENT_ADD, this.addRigidbodyToWorld);
      this.addEventListener(EVENT.COMPONENT_REMOVE, this.removeRigidbodyFromWorld);
      Loop.addEventListener(EVENT.LOOP_FRAME, ComponentRigidbody.getGameStartTransform);
      Loop.addEventListener(EVENT_PHYSICS.INITIALIZE, this.updateFromTransform);
    }

    private static getGameStartTransform(): void {
      let event: Event = new Event(EVENT_PHYSICS.INITIALIZE);
      // Loop.dispatchEvent(event);
      Debug.log("EventDispatched");
      Loop.removeEventListener(EVENT.LOOP_FRAME, ComponentRigidbody.getGameStartTransform);
    }

    public updateFromTransform(): void {
      Loop.removeEventListener(EVENT_PHYSICS.INITIALIZE, this.updateFromTransform);
      //let local: Matrix4x4 = super.getContainer().getComponent(ComponentTransform).local;
      let local: Matrix4x4 = new Matrix4x4();
      let position: Vector3 = local.translation;
      let rotation: Vector3 = local.rotation;
      let scaling: Vector3 = local.scaling;
      this.rigidbody.setPosition(new OIMO.Vec3(position.x, position.y, position.z));
      this.rigidbody.setRotationXyz(new OIMO.Vec3(rotation.x, rotation.y, rotation.z));
      this.rigidbody.removeShape(this.collider);
      this.createCollider(new OIMO.Vec3(scaling.x, scaling.y, scaling.z), this.colliderType);
      this.rigidbody.addShape(this.collider);
      Debug.log("Called");
    }


    /**
   * Get the friction of the rigidbody, which is the factor of sliding resistance of this rigidbody on surfaces
   */
    public getFriction(): number {
      return this.rigidbody.getShapeList().getFriction();
    }


    /**
   * Set the friction of the rigidbody, which is the factor of  sliding resistance of this rigidbody on surfaces
   */
    public setFriction(_friction: number): void {
      this.rigidbody.getShapeList().setFriction(_friction);
    }

    /**
 * Get the restitution of the rigidbody, which is the factor of bounciness of this rigidbody on surfaces
 */
    public getRestitution(): number {
      return this.rigidbody.getShapeList().getRestitution();
    }

    /**
   * Set the restitution of the rigidbody, which is the factor of bounciness of this rigidbody on surfaces
   */
    public setRestitution(_restitution: number): void {
      this.rigidbody.getShapeList().setRestitution(_restitution);
    }

    /**
   * Get the current POSITION of the [[Node]] in the physical space
   */
    public getPosition(): Vector3 {
      let tmpPos: OIMO.Vec3 = this.rigidbody.getPosition();
      return new Vector3(tmpPos.x, tmpPos.y, tmpPos.z);
    }

    /**
     * Get the current ROTATION of the [[Node]] in the physical space
     */
    public getRotation(): Vector3 {
      let orientation: OIMO.Quat = this.rigidbody.getOrientation();
      let tmpQuat: Quaternion = new Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
      return tmpQuat.toDegrees();
    }


    private addRigidbodyToWorld(): void {
      Physics.instance.addRigidbody(this.rigidbody);
    }

    private removeRigidbodyFromWorld(): void {
      Physics.instance.removeRigidbody(this.rigidbody);
    }

    private createRigidbody(_mass: number, _type: PHYSICS_TYPE, _colliderType: COLLIDER_TYPE, _transform: ComponentTransform): void {
      let tmpTransform: Matrix4x4;
      if (_transform == null) {
        tmpTransform = super.getContainer().mtxLocal;
      } else {
        tmpTransform = _transform.local;
      }

      let scale: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.scaling.x / 2, tmpTransform.scaling.y / 2, tmpTransform.scaling.z / 2);
      let position: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.translation.x, tmpTransform.translation.y, tmpTransform.translation.z);
      let rotation: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.rotation.x, tmpTransform.rotation.y, tmpTransform.rotation.z);

      this.createCollider(scale, _colliderType);

      this.massData = new OIMO.MassData();
      this.massData.mass = _mass;

      this.rigidbodyInfo = new OIMO.RigidBodyConfig();
      this.rigidbodyInfo.type = _type;
      this.rigidbodyInfo.position = position;
      this.rigidbodyInfo.rotation.fromEulerXyz(new OIMO.Vec3(rotation.x, rotation.y, rotation.z));
      this.rigidbody = new OIMO.RigidBody(this.rigidbodyInfo);
      this.collider = new OIMO.Shape(this.colliderInfo);
      this.rigidbody.addShape(this.collider);
      this.rigidbody.setMassData(this.massData);

    }

    private createCollider(_scale: OIMO.Vec3, _colliderType: COLLIDER_TYPE): void {
      let shapeConf: OIMO.ShapeConfig = new OIMO.ShapeConfig();
      //Scale == HalfExtends, divide it by 2
      let geometry: OIMO.Geometry;
      this.colliderType = _colliderType;
      switch (_colliderType) {
        case COLLIDER_TYPE.BOX:
          geometry = new OIMO.BoxGeometry(_scale);
          break;
        case COLLIDER_TYPE.SPHERE:
          geometry = new OIMO.SphereGeometry(_scale.x);
          break;
        case COLLIDER_TYPE.CAPSULE:
          geometry = new OIMO.CapsuleGeometry(_scale.x, _scale.y);
          break;
        case COLLIDER_TYPE.CYLINDER:
          geometry = new OIMO.CylinderGeometry(_scale.x, _scale.y);
          break;
      }
      shapeConf.geometry = geometry;
      this.colliderInfo = shapeConf;
    }




    //Basic-TODO: Needs to add/remove itself from the world when created or removed
    //Basic-TODO: Needs to hold information about the collider shape, the weight and such
    //Basic-TODO: Needs set/get functions to change properties of the rb in the physics engine world (eg. static/dynamic/kinematic and such) 
  }
}