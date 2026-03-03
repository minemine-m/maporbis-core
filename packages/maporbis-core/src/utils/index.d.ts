/**
 * @module Utils
 * @description General utility functions for the library.
 */
import { Object3D, Mesh, Texture, Camera, WebGLRenderer, PerspectiveCamera } from "three";
import { WebGPURenderer } from "three/webgpu";
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
export declare function interpolate(tmpl: string, context: Record<string, any>): string;
/**
 * Returns the current timestamp.
 * @returns Current time in milliseconds.
 * @category Utils
 */
export declare function now(): number;
/**
 * Merges properties from source objects into the destination object.
 * @param dest The target object.
 * @param srcs The source objects.
 * @returns The modified target object.
 * @category Utils
 */
export declare function assign<T extends object>(dest: T, ...srcs: any[]): any;
/**
 * Checks if a value is null or undefined.
 * @param val The value to check.
 * @returns True if null or undefined, false otherwise.
 * @category Utils
 */
export declare function isNullOrUndefined(val: any): val is null | undefined;
/**
 * Checks if a value is a valid number (typeof number and not NaN).
 * @param val The value to check.
 * @returns True if it is a valid number.
 * @category Utils
 */
export declare function isValidNumber(val: any): val is number;
/**
 * Waits for a condition to be true.
 * @param conditionFn A function that returns true when the condition is met.
 * @param intervalMs Check interval in milliseconds.
 * @returns A promise that resolves when the condition is met.
 * @category Utils
 */
export declare function waitUntil(conditionFn: () => boolean, intervalMs?: number): Promise<void>;
/**
 * Checks if a number is an integer.
 * @param val The number to check.
 * @returns True if integer.
 * @category Utils
 */
export declare function isInteger(val: number): boolean;
/**
 * Checks if a value is a non-null object.
 * @param val The value to check.
 * @returns True if it is an object.
 * @category Utils
 */
export declare function isObject(val: any): val is object;
/**
 * Checks if a value is a string.
 * @param val The value to check.
 * @returns True if it is a string.
 * @category Utils
 */
export declare function isString(val: any): val is string;
/**
 * Checks if a value is a function.
 * @param val The value to check.
 * @returns True if it is a function.
 * @category Utils
 */
export declare function isFunction(val: any): val is Function;
/**
 * Checks if an object has a specific property.
 * @param target The object.
 * @param prop The property key.
 * @returns True if the object has the property.
 * @category Utils
 */
export declare function hasOwn(target: object, prop: string): boolean;
/**
 * Joins array elements with a separator.
 * @param list The array.
 * @param sep The separator.
 * @returns The joined string.
 * @category Utils
 */
export declare function join(list: any[], sep?: string): string;
/**
 * Checks if an object is empty (has no enumerable properties).
 * @param target The object.
 * @returns True if empty.
 * @category Utils
 */
export declare function isEmpty(target: object): boolean;
/**
 * Converts degrees to radians.
 * @param deg Angle in degrees.
 * @returns Angle in radians.
 * @category Utils
 */
export declare function toRadians(deg: number): number;
/**
 * Converts radians to degrees.
 * @param rad Angle in radians.
 * @returns Angle in degrees.
 * @category Utils
 */
export declare function toDegrees(rad: number): number;
/**
 * Checks if a Three.js object is a Mesh.
 * @param obj The object to check.
 * @returns True if it is a Mesh.
 * @category Utils
 */
export declare function isMesh(obj: Object3D): obj is Mesh;
/**
 * Loads a texture asynchronously.
 * @param path The texture URL.
 * @returns Promise resolving to the Texture.
 * @category Utils
 */
export declare function loadTextureAsync(path: string): Promise<Texture>;
/**
 * Formats a date as "YYYY-MM-DD HH:mm:ss".
 * @param date The date to format. Defaults to now.
 * @returns Formatted string.
 * @category Utils
 */
export declare function formatDate(date?: Date): string;
/**
 * Checks if an object is within the camera's frustum.
 * @param obj The object to check.
 * @param cam The camera.
 * @returns True if intersecting frustum.
 * @category Utils
 */
export declare function isObjectInFrustum(obj: Object3D, cam: Camera): boolean;
/**
 * Calculates the pixel to unit ratio for a given camera and renderer.
 * @param cam The perspective camera.
 * @param renderer The WebGL renderer.
 * @returns The ratio of world units per pixel at the camera's target distance.
 * @category Utils
 */
export declare function getPixelToUnitRatio(cam: PerspectiveCamera, renderer: WebGLRenderer | WebGPURenderer): number;
