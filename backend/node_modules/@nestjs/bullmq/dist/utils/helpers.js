"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProcessorCallback = isProcessorCallback;
exports.isAdvancedProcessor = isAdvancedProcessor;
exports.isSeparateProcessor = isSeparateProcessor;
exports.isAdvancedSeparateProcessor = isAdvancedSeparateProcessor;
exports.getConnectionStatus = getConnectionStatus;
const url_1 = require("url");
function isProcessorCallback(processor) {
    return 'function' === typeof processor;
}
function isAdvancedProcessor(processor) {
    return ('object' === typeof processor &&
        !!processor.callback &&
        isProcessorCallback(processor.callback));
}
function isSeparateProcessor(processor) {
    return 'string' === typeof processor || processor instanceof url_1.URL;
}
function isAdvancedSeparateProcessor(processor) {
    return ('object' === typeof processor &&
        !!processor.path &&
        isSeparateProcessor(processor.path));
}
/**
 * Returns the status of the underlying connection in a version-agnostic way.
 * In bullmq v6, the "connection" property was removed from the high-level
 * classes (Queue, FlowProducer, etc.) in favor of the "getBackend()" method,
 * while in earlier versions the connection was exposed directly as a property.
 */
async function getConnectionStatus(instance) {
    try {
        // bullmq v6+
        if (typeof instance.getBackend === 'function') {
            const backend = instance.getBackend();
            // "client" is only exposed by the Redis backend
            const client = await backend?.client;
            return client?.status;
        }
        // bullmq v3-v5
        return instance.connection?.status;
    }
    catch {
        return undefined;
    }
}
