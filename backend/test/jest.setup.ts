// backend/test/jest.setup.ts
// Fix Jest cross-realm TypedArray instanceof check for native C++ addons
for (const TypedArray of [Float32Array, BigInt64Array, Uint8Array, Int32Array, Float64Array]) {
  Object.defineProperty(TypedArray, Symbol.hasInstance, {
    value: (inst: any) => inst && inst.constructor && inst.constructor.name === TypedArray.name,
    configurable: true,
  });
}

// Pre-load onnxruntime-node once on root isolate to avoid Node 24 napi_add_env_cleanup_hook assertion on repeated requires
try {
  if (!(globalThis as any).__ONNX_RUNTIME__) {
    (globalThis as any).__ONNX_RUNTIME__ = require('onnxruntime-node');
  }
} catch {
  // Ignored if onnxruntime-node is not installed
}
