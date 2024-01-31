import { Resource, SpaceResource } from '@ownclouders/web-client/src'
import { Group, User } from '@ownclouders/web-client/src/generated'
import { RouteLocationRaw } from 'vue-router'
import { IconFillType } from '../../helpers'

export type ActionOptions = Record<string, unknown | unknown[]>
export interface Action<T = ActionOptions> {
  name: string
  icon: string
  iconFillType?: IconFillType
  variation?: string
  appearance?: string
  id?: string
  img?: string
  componentType: 'button' | 'router-link' // FIXME: Should be determined by handler/route
  class?: string
  hasPriority?: boolean
  hideLabel?: boolean
  shortcut?: string
  keepOpen?: boolean
  opensInNewWindow?: boolean
  isExternal?: boolean
  ext?: string

  label(options?: T): string
  isEnabled(options?: T): boolean // FIXME: Should be isVisible

  // componentType: button
  handler?(options?: T): Promise<void> | void

  // componentType: router-link
  route?(options?: T): RouteLocationRaw

  // can be used to display the action in a disabled state in the UI
  isDisabled?(options?: T): boolean
  disabledTooltip?(options?: T): string
}

export type FileActionOptions<T extends Resource = Resource> = {
  space: SpaceResource
  resources?: T[]
}
export type FileAction<T extends Resource = Resource> = Action<FileActionOptions<T>>

export type GroupActionOptions = {
  resources: Group[]
}
export type GroupAction = Action<GroupActionOptions>

export type SpaceActionOptions = {
  resources?: SpaceResource[]
}
export type SpaceAction = Action<SpaceActionOptions>

export type UserActionOptions = {
  resources: User[]
}
export type UserAction = Action<UserActionOptions>
