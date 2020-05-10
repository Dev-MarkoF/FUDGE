///<reference path="../../../Physics/OIMOPhysics.d.ts"/>

namespace FudgeCore {
  /**
     * Acts as the physical representation of the [[Node]] it's attached to.
     * It's the connection between the Fudge Rendered World and the Physics World
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentRigidbody extends Component {

    private rigidbody: OIMO.RigidBody;
    private massData: OIMO.MassData;
    private collider: OIMO.ShapeConfig;
    private rigidbodyInfo: OIMO.RigidBodyConfig;

    constructor(_mass: number = 1, _type: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC, _colliderType: COLLIDER_TYPE = COLLIDER_TYPE.BOX, _transform: ComponentTransform = null) {
      super();
      this.createRigidbody(_mass, _type, _colliderType, _transform);
      this.addEventListener(EVENT.COMPONENT_ADD, this.addRigidbodyToWorld);
      this.addEventListener(EVENT.COMPONENT_REMOVE, this.removeRigidbodyFromWorld);
    }



    public testRendering(): void {
      Debug.log("Overwrite through physics");
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
      Debug.log("Add this to the physical world");
    }

    private removeRigidbodyFromWorld(): void {
      Physics.instance.removeRigidbody(this.rigidbody);
      Debug.log("Remove this from the physical world");
    }

    private createRigidbody(_mass: number, _type: PHYSICS_TYPE, _colliderType: COLLIDER_TYPE, _transform: ComponentTransform): void {
      let tmpTransform: Matrix4x4;
      if (_transform == null)
        tmpTransform = this.getContainer().mtxLocal;
      else
        tmpTransform = _transform.local;

      let scale: OIMO.Vec3 = new OIMO.Vec3(tmpTransform.scaling.x, tmpTransform.scaling.y, tmpTransform.scaling.z);
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
      this.rigidbody.addShape(new OIMO.Shape(this.collider));
      this.rigidbody.setMassData(this.massData);

    }

    private createCollider(_scale: OIMO.Vec3, _colliderType: COLLIDER_TYPE): void {
      let shapeConf: OIMO.ShapeConfig = new OIMO.ShapeConfig();
      //Scale == HalfExtends, divide it by 2
      let geometry: OIMO.Geometry;
      switch (_colliderType) {
        case COLLIDER_TYPE.BOX:
          geometry = new OIMO.BoxGeometry(_scale);
          break;
      }
      shapeConf.geometry = geometry;
      this.collider = shapeConf;
    }



    //Basic-TODO: Needs to add/remove itself from the world when created or removed
    //Basic-TODO: Needs to hold information about the collider shape, the weight and such
    //Basic-TODO: Needs set/get functions to change properties of the rb in the physics engine world (eg. static/dynamic/kinematic and such) 
  }
}