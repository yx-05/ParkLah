for (const TypedArray of [Float32Array, BigInt64Array, Uint8Array, Int32Array, Float64Array]) {
    Object.defineProperty(TypedArray, Symbol.hasInstance, {
        value: (inst) => inst && inst.constructor && inst.constructor.name === TypedArray.name,
        configurable: true,
    });
}
try {
    if (!globalThis.__ONNX_RUNTIME__) {
        globalThis.__ONNX_RUNTIME__ = require('onnxruntime-node');
    }
}
catch {
}
//# sourceMappingURL=jest.setup.js.map