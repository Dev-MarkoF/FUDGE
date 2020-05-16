///<reference path="../../../Physics/OIMOPhysics.d.ts"/>

namespace FudgeCore {
  /**
     * Acts as the physical representation of the [[Node]] it's attached to.
     * It's the connection between the Fudge Rendered world and the Physics world
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentRigidbody extends Component {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentRigidbody);

    public physicsType: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC;
    public colliderType: COLLIDER_TYPE;
    public collisionGroup: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT;
    get mass(): number {
      return this.rigidbody.getMass();
    }
    set mass(value: number) {
      this.massData.mass = value;
      this.rigidbody.setMassData(this.massData);
    }

    private rigidbody: OIMO.RigidBody;
    private massData: OIMO.MassData;
    private collider: OIMO.Shape;
    private colliderInfo: OIMO.ShapeConfig;
    private rigidbodyInfo: OIMO.RigidBodyConfig;

    constructor(_mass: number = 1, _type: PHYSICS_TYPE = PHYSICS_TYPE.DYNAMIC, _colliderType: COLLIDER_TYPE = COLLIDER_TYPE.BOX, _group: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT, _transform: Matrix4x4 = null) {
      super();
      this.createRigidbody(_mass, _type, _colliderType, _transform, _group);
      this.addEventListener(EVENT.COMPONENT_ADD, this.addRigidbodyToWorld);
      this.addEventListener(EVENT.COMPONENT_REMOVE, this.removeRigidbodyFromWorld);
    }

    /**
   * Removes and recreates the Rigidbody from the world matrix of the [[Node]]
   */
    public updateFromWorld(): void {
      // let local: Matrix4x4 = super.getContainer().mtxWorld;
      // let position: Vector3 = local.translation;
      // let rotation: Vector3 = local.rotation;
      // let scaling: Vector3 = local.scaling;
      // this.rigidbody.setPosition(new OIMO.Vec3(position.x, position.y, position.z));
      // this.rigidbody.setRotationXyz(new OIMO.Vec3(rotation.x, rotation.y, rotation.z));
      // //this.rigidbody.removeShape(this.collider);;
      // this.createCollider(new OIMO.Vec3(scaling.x, scaling.y, scaling.z), this.colliderType);
      // this.collider = new OIMO.Shape(this.colliderInfo);
      // this.rigidbody.addShape(this.collider);
      // this.rigidbody.removeShape(this.rigidbody.getShapeList());
      this.removeRigidbodyFromWorld();
      this.createRigidbody(this.mass, this.physicsType, this.colliderType, null, this.collisionGroup);
      this.addRigidbodyToWorld();
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
  * Sets the current POSITION of the [[Node]] in the physical space
  */
    public setPosition(_value: Vector3): void {
      this.rigidbody.setPosition(new OIMO.Vec3(_value.x, _value.y, _value.z));
    }

    /**
     * Get the current ROTATION of the [[Node]] in the physical space
     */
    public getRotation(): Vector3 {
      let orientation: OIMO.Quat = this.rigidbody.getOrientation();
      let tmpQuat: Quaternion = new Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);
      return tmpQuat.toDegrees();
    }


    /**
     * Sets the current ROTATION of the [[Node]] in the physical space, in degree.
     */
    public setRotation(_value: Vector3): void {
      let radians: OIMO.Vec3 = new OIMO.Vec3(_value.x * (Math.PI / 180), _value.y * (Math.PI / 180), _value.z * (Math.PI / 180));
      this.rigidbody.setRotationXyz(radians);
    }

    /**
    * Get the current VELOCITY of the [[Node]]
    */
    public getVelocity(): Vector3 {
      let velocity: OIMO.Vec3 = this.rigidbody.getLinearVelocity();
      return new Vector3(velocity.x, velocity.y, velocity.z);
    }


    /**
     * Sets the current VELOCITY of the [[Node]]
     */
    public setVelocity(_value: Vector3): void {
      let velocity: OIMO.Vec3 = new OIMO.Vec3(_value.x, _value.y, _value.z);
      this.rigidbody.setLinearVelocity(velocity);
    }


    /**
     * Sends a ray through this specific body ignoring the rest of the world and checks if this body was hit by the ray,
     * returning info about the hit.
     */
    public raycastThisBody(_origin: Vector3, _direction: Vector3, _length: number): RayHitInfo {
      let hitInfo: RayHitInfo = new RayHitInfo();
      let geometry: OIMO.Geometry = this.rigidbody.getShapeList().getGeometry();
      let transform: OIMO.Transform = this.rigidbody.getTransform();
      let endpoint: Vector3 = Vector3.ZERO();
      endpoint.add(_origin);
      let endDirection: Vector3 = _direction;
      endDirection.scale(_length);
      endpoint.add(endDirection);
      let oimoRay: OIMO.RayCastHit;
      let hit: boolean = geometry.rayCast(new OIMO.Vec3(_origin.x, _origin.y, _origin.z), new OIMO.Vec3(endpoint.x, endpoint.y, endpoint.z), transform, oimoRay);
      if (hit) {
        hitInfo.hit = true;
        hitInfo.hitPoint = new Vector3(oimoRay.position.x, oimoRay.position.y, oimoRay.position.z);
        hitInfo.hitNormal = new Vector3(oimoRay.normal.x, oimoRay.normal.y, oimoRay.normal.z);
        let dx: number = _origin.x - hitInfo.hitPoint.x;
        let dy: number = _origin.y - hitInfo.hitPoint.y;
        let dz: number = _origin.z - hitInfo.hitPoint.z;
        hitInfo.hitDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        hitInfo.rigidbodyComponent = this;
      }
      return hitInfo;
    }


    private addRigidbodyToWorld(): void {
      Physics.world.addRigidbody(this.rigidbody, this);
    }

    private removeRigidbodyFromWorld(): void {
      Physics.world.removeRigidbody(this.rigidbody, this);
    }

    private createRigidbody(_mass: number, _type: PHYSICS_TYPE, _colliderType: COLLIDER_TYPE, _transform: Matrix4x4, _collisionGroup: PHYSICS_GROUP = PHYSICS_GROUP.DEFAULT): void {
      let tmpTransform: Matrix4x4 = _transform == null ? super.getContainer() != null ? super.getContainer().mtxWorld : Matrix4x4.IDENTITY() : _transform;

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
      this.collider.userData = this;
      this.rigidbody.addShape(this.collider);
      this.rigidbody.setMassData(this.massData);
    }

    private createCollider(_scale: OIMO.Vec3, _colliderType: COLLIDER_TYPE): void {
      let shapeConf: OIMO.ShapeConfig = new OIMO.ShapeConfig();
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

  }
}