/**
 * @module Utils
 * @description General utility functions for the library.
 */
import { TextureLoader, Matrix4, Frustum } from "three";
/**
 * Export createobject utilities
 * 导出创建对象工具函数
 */
export * from './createobject';
/**
 * Export validate utilities
 * 导出验证工具函数
 */
export * from './validate';
/**
 * Export WebGPU compatibility utilities
 * 导出 WebGPU 兼容性工具函数
 */
export * from './WebGPUCompat';
/**
 * Interpolates a template string with data.
 * Replaces occurrences of `{key}` with values from `data`.
 * @param template The template string.
 * @param data The data object.
 * @returns The interpolated string.
 * @throws Will throw an error if a key is missing in data.
 * @category Utils
 */
export function interpolate(tmpl, context) {
    return tmpl.replace(/\{(\w+)\}/g, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(context, key)) {
            const value = context[key];
            return value !== undefined ? String(value) : match;
        }
        throw new Error(`Missing required parameter for template interpolation: "${key}"`);
    });
}
/**
 * Returns the current timestamp.
 * @returns Current time in milliseconds.
 * @category Utils
 */
export function now() {
    return Date.now();
}
/**
 * Merges properties from source objects into the destination object.
 * @param dest The target object.
 * @param srcs The source objects.
 * @returns The modified target object.
 * @category Utils
 */
export function assign(dest, ...srcs) {
    return Object.assign(dest, ...srcs);
}
/**
 * Checks if a value is null or undefined.
 * @param val The value to check.
 * @returns True if null or undefined, false otherwise.
 * @category Utils
 */
export function isNullOrUndefined(val) {
    return val == null;
}
/**
 * Checks if a value is a valid number (typeof number and not NaN).
 * @param val The value to check.
 * @returns True if it is a valid number.
 * @category Utils
 */
export function isValidNumber(val) {
    return typeof val === 'number' && !Number.isNaN(val);
}
/**
 * Waits for a condition to be true.
 * @param conditionFn A function that returns true when the condition is met.
 * @param intervalMs Check interval in milliseconds.
 * @returns A promise that resolves when the condition is met.
 * @category Utils
 */
export function waitUntil(conditionFn, intervalMs = 100) {
    return new Promise(resolve => {
        const check = () => {
            if (conditionFn()) {
                resolve();
            }
            else {
                setTimeout(check, intervalMs);
            }
        };
        check();
    });
}
/**
 * Checks if a number is an integer.
 * @param val The number to check.
 * @returns True if integer.
 * @category Utils
 */
export function isInteger(val) {
    return Number.isInteger(val);
}
/**
 * Checks if a value is a non-null object.
 * @param val The value to check.
 * @returns True if it is an object.
 * @category Utils
 */
export function isObject(val) {
    return typeof val === 'object' && val !== null;
}
/**
 * Checks if a value is a string.
 * @param val The value to check.
 * @returns True if it is a string.
 * @category Utils
 */
export function isString(val) {
    return typeof val === 'string' || (val instanceof String);
}
/**
 * Checks if a value is a function.
 * @param val The value to check.
 * @returns True if it is a function.
 * @category Utils
 */
export function isFunction(val) {
    return typeof val === 'function';
}
/**
 * Checks if an object has a specific property.
 * @param target The object.
 * @param prop The property key.
 * @returns True if the object has the property.
 * @category Utils
 */
export function hasOwn(target, prop) {
    return Object.prototype.hasOwnProperty.call(target, prop);
}
/**
 * Joins array elements with a separator.
 * @param list The array.
 * @param sep The separator.
 * @returns The joined string.
 * @category Utils
 */
export function join(list, sep = ',') {
    return list.join(sep);
}
/**
 * Checks if an object is empty (has no enumerable properties).
 * @param target The object.
 * @returns True if empty.
 * @category Utils
 */
export function isEmpty(target) {
    if (isNullOrUndefined(target))
        return true;
    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key))
            return false;
    }
    return true;
}
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
/**
 * Converts degrees to radians.
 * @param deg Angle in degrees.
 * @returns Angle in radians.
 * @category Utils
 */
export function toRadians(deg) {
    return deg * DEG2RAD;
}
/**
 * Converts radians to degrees.
 * @param rad Angle in radians.
 * @returns Angle in degrees.
 * @category Utils
 */
export function toDegrees(rad) {
    return rad * RAD2DEG;
}
/**
 * Checks if a Three.js object is a Mesh.
 * @param obj The object to check.
 * @returns True if it is a Mesh.
 * @category Utils
 */
export function isMesh(obj) {
    return obj.isMesh === true;
}
/**
 * Loads a texture asynchronously.
 * @param path The texture URL.
 * @returns Promise resolving to the Texture.
 * @category Utils
 */
export async function loadTextureAsync(path) {
    const loader = new TextureLoader();
    return loader.loadAsync(path);
}
/**
 * Formats a date as "YYYY-MM-DD HH:mm:ss".
 * @param date The date to format. Defaults to now.
 * @returns Formatted string.
 * @category Utils
 */
export function formatDate(date = new Date()) {
    const pad = (n) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
/**
 * Checks if an object is within the camera's frustum.
 * @param obj The object to check.
 * @param cam The camera.
 * @returns True if intersecting frustum.
 * @category Utils
 */
export function isObjectInFrustum(obj, cam) {
    const frustum = new Frustum();
    const matrix = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    return frustum.intersectsObject(obj);
}
/**
 * Calculates the pixel to unit ratio for a given camera and renderer.
 * @param cam The perspective camera.
 * @param renderer The WebGL renderer.
 * @returns The ratio of world units per pixel at the camera's target distance.
 * @category Utils
 */
export function getPixelToUnitRatio(cam, renderer) {
    const distance = cam.position.length(); // Assuming looking at origin or similar
    // Note: This logic seems specific to a certain setup. Keeping as is but cleaning up.
    // Ideally distance should be from camera to the plane of interest.
    const fovRad = cam.fov * DEG2RAD;
    const height = 2 * Math.tan(fovRad / 2) * distance;
    const clientHeight = renderer.domElement.clientHeight;
    return clientHeight > 0 ? height / clientHeight : 0;
}
