import { BullQueueProcessor, BullQueueProcessorCallback, BullQueueSeparateProcessor } from '../bull.types';
import { BullQueueAdvancedProcessor, BullQueueAdvancedSeparateProcessor } from '../interfaces/bull-processor.interfaces';
export declare function isProcessorCallback(processor: BullQueueProcessor): processor is BullQueueProcessorCallback;
export declare function isAdvancedProcessor(processor: BullQueueProcessor): processor is BullQueueAdvancedProcessor;
export declare function isSeparateProcessor(processor: BullQueueProcessor): processor is BullQueueSeparateProcessor;
export declare function isAdvancedSeparateProcessor(processor: BullQueueProcessor): processor is BullQueueAdvancedSeparateProcessor;
/**
 * Returns the status of the underlying connection in a version-agnostic way.
 * In bullmq v6, the "connection" property was removed from the high-level
 * classes (Queue, FlowProducer, etc.) in favor of the "getBackend()" method,
 * while in earlier versions the connection was exposed directly as a property.
 */
export declare function getConnectionStatus(instance: unknown): Promise<string | undefined>;
//# sourceMappingURL=helpers.d.ts.map