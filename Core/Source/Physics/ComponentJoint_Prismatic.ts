namespace FudgeCore {
  /**
     * A physical connection between two bodies with a defined axe movement.
     * Used to create things like springs.
     * @authors Marko Fehrenbach, HFU, 2020
     */
  export class ComponentJointPrismatic extends ComponentJoint {
    private oimoJoint: OIMO.Joint;

    constructor(_attachedRigidbody: ComponentRigidbody = null, _connectedRigidbody: ComponentRigidbody = null) {
      super(_attachedRigidbody, _connectedRigidbody);
      //The node either already has a attachedRigidbody or these components will create own. Or they will notify that a rigidbody is needed 
    }


    public initializeConnection(): void {
      //needs to be called when the two necessary main variables are set. Can't create a connection with only 1 RB. But could possibly be done by
      //the connection itself on gamestart? And changes are saved seperatly and then used for the connection creation at the gamestart?
      this.constructJoint();
      this.addConstraintToWorld();
    }

    public addConstraintToWorld(): void {
      Physics.world.addJoint(this);
    }

    public removeConstraintFromWorld(): void {
      Physics.world.removeJoint(this);
    }

    public getOimoJoint(): OIMO.Joint {
      return this.oimoJoint;
    }

    private constructJoint(): void {
      let jc: OIMO.PrismaticJointConfig = new OIMO.PrismaticJointConfig();
      let lm: OIMO.TranslationalLimitMotor;
      let sd: OIMO.SpringDamper;
      let anchor: OIMO.Vec3;
      let axis: OIMO.Vec3;
      jc.init(super.attachedRigidbody.getOimoRigidbody(), super.connectedRigidbody.getOimoRigidbody(), anchor, axis);
      if (sd != null) jc.springDamper = sd;
      if (lm != null) jc.limitMotor = lm;
      var j: OIMO.PrismaticJoint = new OIMO.PrismaticJoint(jc);
      this.oimoJoint = j;
    }

  }
}