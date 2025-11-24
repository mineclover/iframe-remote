/**
 * iframe-remote
 * Bidirectional iframe communication protocol implementation
 */

export { ChildCommunicator } from './child'
export {
  assertValidFunctionMeta,
  assertValidParamMeta,
  FunctionMetaSchema,
  isValidFunctionMeta,
  isValidParamMeta,
  ParamMetaSchema,
  ParamTypeSchema,
  validateFunctionMeta,
  validateParamMeta,
} from './metadata-validator'
export { ParentCommunicator } from './parent'
export { ChildRPC, ParentRPC } from './rpc'
export type {
  CommunicatorOptions,
  Message,
  MessageType,
  PendingRequest,
  RequestMessage,
  ResponseMessage,
} from './types'
export type {
  API,
  MethodHandler,
  MethodName,
  RPCCaller,
  RPCCallMessage,
  RPCCallOptions,
  RPCHandler,
  RPCHandlerMap,
  RPCResponseMessage,
} from './types-rpc'
export { RPCError } from './types-rpc'
