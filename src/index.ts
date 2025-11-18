/**
 * iframe-remote
 * Bidirectional iframe communication protocol implementation
 */

export { ParentCommunicator } from './parent'
export { ChildCommunicator } from './child'
export { ParentRPC, ChildRPC } from './rpc'

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
