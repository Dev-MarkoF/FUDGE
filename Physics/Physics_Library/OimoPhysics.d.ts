// typings.d.ts
declare interface Window {
	OIMO?: OIMO & typeof OIMO
}

declare interface OIMO {

}

declare namespace OIMO {
	export class Quat {/**
		* Creates a new quaternion. The quaternion is identity by default.
		*/
		constructor(x?: number, y?: number, z?: number, w?: number);
		/**
		 * The x-value of the imaginary part of the quaternion.
		 */
		x: number;
		/**
		 * The y-value of the imaginary part of the quaternion.
		 */
		y: number;
		/**
		 * The z-value of the imaginary part of the quaternion.
		 */
		z: number;
		/**
		 * The real part of the quaternion.
		 */
		w: number;
		/**
		 * Sets the quaternion to identity quaternion and returns `this`.
		 */
		identity(): oimo.common.Quat;
		/**
		 * Sets all values at once and returns `this`.
		 */
		init(x: number, y: number, z: number, w: number): oimo.common.Quat;
		/**
		 * Returns `this` + `v`.
		 */
		add(q: oimo.common.Quat): oimo.common.Quat;
		/**
		 * Returns `this` - `v`.
		 */
		sub(q: oimo.common.Quat): oimo.common.Quat;
		/**
		 * Returns `this` * `s`.
		 */
		scale(s: number): oimo.common.Quat;
		/**
		 * Sets this quaternion to `this` + `v` and returns `this`.
		 */
		addEq(q: oimo.common.Quat): oimo.common.Quat;
		/**
		 * Sets this quaternion to `this` - `v` and returns `this`.
		 */
		subEq(q: oimo.common.Quat): oimo.common.Quat;
		/**
		 * Sets this quaternion to `this` * `s` and returns `this`.
		 */
		scaleEq(s: number): oimo.common.Quat;
		/**
		 * Returns the length of the quaternion.
		 */
		length(): number;
		/**
		 * Returns the squared length of the quaternion.
		 */
		lengthSq(): number;
		/**
		 * Returns the dot product of `this` and `q`.
		 */
		dot(q: oimo.common.Quat): number;
		/**
		 * Returns the normalized quaternion.
		 *
		 * If the length is zero, zero quaterinon is returned.
		 */
		normalized(): oimo.common.Quat;
		/**
		 * Sets this quaternion to the normalized quaternion and returns `this`.
		 *
		 * If the length is zero, this quaternion is set to zero quaternion.
		 */
		normalize(): oimo.common.Quat;
		/**
		 * Sets this quaternion to the quaternion representing the shortest arc
		 * rotation from `v1` to `v2`, and return `this`.
		 */
		setArc(v1: oimo.common.Vec3, v2: oimo.common.Vec3): oimo.common.Quat;
		/**
		 * Returns the spherical linear interpolation between two quaternions `this` and `q` with interpolation paraeter `t`.
		 * Both quaternions `this` and `q` must be normalized.
		 */
		slerp(q: oimo.common.Quat, t: number): oimo.common.Quat;
		/**
		 * Copies values from `q` and returns `this`.
		 */
		copyFrom(q: oimo.common.Quat): oimo.common.Quat;
		/**
		 * Returns a clone of the quaternion.
		 */
		clone(): oimo.common.Quat;
		/**
		 * Sets this quaternion to the representation of the matrix `m`, and returns `this`.
		 *
		 * The matrix `m` must be a rotation matrix, that is, must be orthogonalized and have determinant 1.
		 */
		fromMat3(m: oimo.common.Mat3): oimo.common.Quat;
		/**
		 * Returns a rotation matrix which represents this quaternion.
		 */
		toMat3(): oimo.common.Mat3;
		/**
		 * Returns the string representation of the quaternion.
		 */
		toString(): string;
		/**
		 * The number of instance creation.
		 */
		static numCreations: number;
	}
}