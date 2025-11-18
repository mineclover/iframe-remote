/**
 * iframe-remote
 * Bidirectional iframe communication protocol implementation
 */

export { ParentCommunicator } from './parent'
export { ChildCommunicator } from './child'
export { ParentRPC, ChildRPC } from './rpc'
export { ParentDevTools, ChildDevTools } from './devtools'

export type {
  Message,
  MessageType,
  RequestMessage,
  ResponseMessage,
  CommunicatorOptions,
  PendingRequest,
} from './types'

export type {
  API,
  MethodName,
  MethodHandler,
  RPCCallMessage,
  RPCResponseMessage,
  RPCHandlerMap,
  RPCCallOptions,
  RPCCaller,
  RPCHandler,
} from './types-rpc'

export { RPCError } from './types-rpc'

export type {
  DevToolsOptions,
  FunctionInfo,
  ParamInfo,
} from './devtools'

export type {
  ParamType,
  ParamMetaBase,
  SelectParamMeta,
  NumberParamMeta,
  StringParamMeta,
  BooleanParamMeta,
  ArrayParamMeta,
  ColorParamMeta,
  TimeParamMeta,
  DateParamMeta,
  RangeParamMeta,
  ParamMeta,
  FunctionMeta,
  FunctionWithMeta,
} from './types-devtools'

export {
  createFunctionMeta,
  withMeta,
  validateParamMeta,
  validateFunctionMeta,
} from './types-devtools'
