/**
 * iframe-remote
 * Bidirectional iframe communication protocol implementation
 */

export { ChildCommunicator } from './child'
export type {
  DevToolsOptions,
  FunctionInfo,
} from './devtools'
export { ChildDevTools, ParentDevTools } from './devtools'
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
  ArrayParamMeta,
  BooleanParamMeta,
  ColorParamMeta,
  DateParamMeta,
  FunctionMeta,
  FunctionWithMeta,
  NumberParamMeta,
  ParamMeta,
  ParamMetaBase,
  ParamType,
  RangeParamMeta,
  SelectParamMeta,
  StringParamMeta,
  TimeParamMeta,
} from './types-devtools'
export {
  createFunctionMeta,
  withMeta,
} from './types-devtools'
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
