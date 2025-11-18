/**
 * iframe-remote
 * Bidirectional iframe communication protocol implementation
 */

export { ParentCommunicator } from './parent'
export { ChildCommunicator } from './child'
export type {
  Message,
  MessageType,
  RequestMessage,
  ResponseMessage,
  CommunicatorOptions,
  PendingRequest,
} from './types'
