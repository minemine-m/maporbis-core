/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isFunction } from '../utils';
import { IS_NODE } from '../utils/env';

export interface IBrowserCapabilities {
    IS_NODE: boolean;
    isTest: boolean;
    ie: boolean;
    ielt9: boolean;
    edge: boolean;
    webkit: boolean;
    gecko: boolean;
    android: boolean;
    android23: boolean;
    chrome: boolean;
    chromeVersion: string;
    safari: boolean;
    phantomjs: boolean;
    ie3d: boolean;
    webkit3d: boolean;
    opera12: boolean;
    gecko3d: boolean;
    any3d: boolean;
    iosWeixin: boolean;
    mobile: boolean;
    mobileWebkit: boolean;
    mobileWebkit3d: boolean;
    mobileOpera: boolean;
    mobileGecko: boolean;
    touch: boolean;
    msPointer: boolean;
    pointer: boolean;
    retina: boolean;
    devicePixelRatio: number;
    language: string;
    ie9: boolean;
    ie10: boolean;
    webgl: boolean;
    imageBitMap: boolean;
    resizeObserver: boolean;
    btoa: boolean;
    decodeImageInWorker: boolean;
    monitorDPRChange: boolean;
    supportsPassive: boolean;
    proxy: boolean;
    requestIdleCallback: boolean;
    checkDevicePixelRatio: () => boolean;
}

const getDevicePixelRatio = (): number => {
    if (typeof window === 'undefined') return 1;
    // @ts-ignore
    return (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI) || 1);
};

const detectBrowser = (): IBrowserCapabilities => {
    if (IS_NODE) {
        return {
            IS_NODE,
            isTest: false,
            ie: false,
            ielt9: false,
            edge: false,
            webkit: false,
            gecko: false,
            android: false,
            android23: false,
            chrome: false,
            chromeVersion: '0',
            safari: false,
            phantomjs: false,
            ie3d: false,
            webkit3d: false,
            opera12: false,
            gecko3d: false,
            any3d: false,
            iosWeixin: false,
            mobile: false,
            mobileWebkit: false,
            mobileWebkit3d: false,
            mobileOpera: false,
            mobileGecko: false,
            touch: false,
            msPointer: false,
            pointer: false,
            retina: false,
            devicePixelRatio: 1,
            language: 'en',
            ie9: false,
            ie10: false,
            webgl: false,
            imageBitMap: false,
            resizeObserver: false,
            btoa: false,
            decodeImageInWorker: false,
            monitorDPRChange: false,
            supportsPassive: false,
            proxy: false,
            requestIdleCallback: false,
            checkDevicePixelRatio: () => false,
        };
    }

    const ua = navigator.userAgent.toLowerCase();
    const doc = document.documentElement || { style: {} };

    const ie = 'ActiveXObject' in window;
    const webkit = ua.includes('webkit');
    const phantomjs = ua.includes('phantom');
    const android23 = ua.search('android [23]') !== -1;
    const chrome = ua.includes('chrome');
    const gecko = ua.includes('gecko') && !webkit && !('opera' in window) && !ie;
    const iosWeixin = /iphone/i.test(ua) && /micromessenger/i.test(ua);

    const mobile = typeof orientation !== 'undefined' || ua.includes('mobile');
    const msPointer = !window.PointerEvent && ('MSPointerEvent' in window);
    // @ts-ignore
    const pointer = (window.PointerEvent && navigator.pointerEnabled) || msPointer;

    const ie3d = ie && ('transition' in doc.style);
    const webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23;
    const gecko3d = 'MozPerspective' in doc.style;
    const opera12 = 'OTransition' in doc.style;
    const any3d = (ie3d || webkit3d || gecko3d) && !opera12 && !phantomjs;

    const imageBitMap = typeof window !== 'undefined' && isFunction(window.createImageBitmap);
    const resizeObserver = typeof window !== 'undefined' && isFunction(window.ResizeObserver);
    const btoa = typeof window !== 'undefined' && isFunction(window.btoa);
    const proxy = typeof window !== 'undefined' && isFunction(window.Proxy);
    const requestIdleCallback = typeof window !== 'undefined' && isFunction(window.requestIdleCallback);

    let chromeVersion = '0';
    if (chrome) {
        const matchResult = ua.match(/chrome\/([\d.]+)/);
        chromeVersion = matchResult ? matchResult[1] : '0';
    }

    const touch = !phantomjs && (pointer || 'ontouchstart' in window ||
        ('DocumentTouch' in window && document instanceof (window as any).DocumentTouch));

    const webgl = typeof window !== 'undefined' && ('WebGLRenderingContext' in window);
    const devicePixelRatio = getDevicePixelRatio();

    let decodeImageInWorker = false;
    try {
        const offCanvas = new OffscreenCanvas(2, 2);
        offCanvas.getContext('2d');
        decodeImageInWorker = true;
    } catch (err) {
        decodeImageInWorker = false;
    }

    let supportsPassive = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: () => {
                supportsPassive = true;
                return true;
            }
        });
        window.addEventListener('testPassive', () => { }, opts);
    } catch (e) {
        // ignore
    }

    const browserInfo: IBrowserCapabilities = {
        IS_NODE,
        isTest: false,
        ie,
        ielt9: ie && !document.addEventListener,
        edge: 'msLaunchUri' in navigator && !('documentMode' in document),
        webkit,
        gecko,
        android: ua.includes('android'),
        android23,
        chrome,
        chromeVersion,
        safari: !chrome && ua.includes('safari'),
        phantomjs,
        ie3d,
        webkit3d,
        gecko3d,
        opera12,
        any3d,
        iosWeixin,
        mobile,
        mobileWebkit: mobile && webkit,
        mobileWebkit3d: mobile && webkit3d,
        mobileOpera: mobile && ('opera' in window),
        mobileGecko: mobile && gecko,
        touch: !!touch,
        msPointer: !!msPointer,
        pointer: !!pointer,
        retina: devicePixelRatio > 1,
        devicePixelRatio,
        // @ts-ignore
        language: navigator.browserLanguage || navigator.language,
        // @ts-ignore
        ie9: ie && document.documentMode === 9,
        // @ts-ignore
        ie10: ie && document.documentMode === 10,
        webgl,
        imageBitMap,
        resizeObserver,
        btoa,
        decodeImageInWorker,
        monitorDPRChange: true,
        supportsPassive,
        proxy,
        requestIdleCallback,
        checkDevicePixelRatio: () => {
            if (typeof window !== 'undefined' && browserInfo.monitorDPRChange) {
                const currentDPR = getDevicePixelRatio();
                const changed = currentDPR !== browserInfo.devicePixelRatio;
                if (changed) {
                    browserInfo.devicePixelRatio = currentDPR;
                }
                return changed;
            }
            return false;
        }
    };
    return browserInfo;
};

const Browser = detectBrowser();
export default Browser;
