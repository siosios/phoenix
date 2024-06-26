import { SpaceResource } from '@ownclouders/web-client'
import { computed } from 'vue'
import { SpaceAction, SpaceActionOptions } from '../types'
import { useClientService } from '../../clientService'
import { useLoadingService } from '../../loadingService'
import { useGettext } from 'vue3-gettext'
import { useMessages, useModals, useSpacesStore, useUserStore } from '../../piniaStores'
import { useCreateSpace } from '../../spaces'
import { buildSpace } from '@ownclouders/web-client'
import { eventBus } from '../../../services'
import { Drive } from '@ownclouders/web-client/graph/generated'
import { blobToArrayBuffer, canvasToBlob } from '../../../helpers'
import EmojiPickerModal from '../../../components/Modals/EmojiPickerModal.vue'

export const useSpaceActionsSetIcon = () => {
  const userStore = useUserStore()
  const { showMessage, showErrorMessage } = useMessages()
  const { $gettext } = useGettext()
  const clientService = useClientService()
  const loadingService = useLoadingService()
  const spacesStore = useSpacesStore()
  const { createDefaultMetaFolder } = useCreateSpace()
  const { dispatchModal } = useModals()
  const handler = ({ resources }: SpaceActionOptions) => {
    if (resources.length !== 1) {
      return
    }

    dispatchModal({
      elementClass: 'oc-width-auto',
      title: $gettext('Set icon for %{space}', { space: resources[0].name }),
      hideConfirmButton: true,
      customComponent: EmojiPickerModal,
      focusTrapInitial: 'em-emoji-picker',
      onConfirm: (emoji: string) => setIconSpace(resources[0], emoji)
    })
  }

  const generateEmojiImage = async (emoji: string): Promise<ArrayBuffer | string> => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const aspectRatio = 16 / 9,
      width = 720,
      height = width / aspectRatio

    canvas.width = width
    canvas.height = height

    const textSize = 0.4 * width
    context.font = `${textSize}px sans-serif`

    context.textBaseline = 'middle'
    context.textAlign = 'center'

    // FIXME: This offset center the emoji vertical, try to do it programmatically
    const heightOffset = 15

    context.fillText(emoji, canvas.width / 2, canvas.height / 2 + heightOffset)

    const blob = await canvasToBlob(canvas)
    return blobToArrayBuffer(blob)
  }

  const setIconSpace = async (space: SpaceResource, emoji: string) => {
    const graphClient = clientService.graphAuthenticated
    const content = await generateEmojiImage(emoji)

    try {
      await clientService.webdav.getFileInfo(space, { path: '.space' })
    } catch (_) {
      await createDefaultMetaFolder(space)
    }

    return loadingService.addTask(async () => {
      const headers = {
        'Content-Type': 'application/offset+octet-stream'
      }

      try {
        const { fileId } = await clientService.webdav.putFileContents(space, {
          path: `/.space/emoji.png`,
          content,
          headers,
          overwrite: true
        })

        const { data } = await graphClient.drives.updateDrive(
          space.id.toString(),
          {
            special: [
              {
                specialFolder: {
                  name: 'image'
                },
                id: fileId
              }
            ]
          } as Drive,
          {}
        )

        spacesStore.updateSpaceField({
          id: space.id.toString(),
          field: 'spaceImageData',
          value: data.special.find((special) => special.specialFolder.name === 'image')
        })
        showMessage({ title: $gettext('Space icon was set successfully') })
        eventBus.publish('app.files.spaces.uploaded-image', buildSpace(data))
      } catch (error) {
        console.error(error)
        showErrorMessage({
          title: $gettext('Failed to set space icon'),
          errors: [error]
        })
      }
    })
  }

  const actions = computed((): SpaceAction[] => [
    {
      name: 'set-space-icon',
      icon: 'emoji-sticker',
      handler,
      label: () => {
        return $gettext('Set icon')
      },
      isVisible: ({ resources }) => {
        if (resources.length !== 1) {
          return false
        }

        return resources[0].canEditImage({ user: userStore.user })
      },
      componentType: 'button',
      class: 'oc-files-actions-set-space-icon-trigger'
    }
  ])

  return {
    actions,
    setIconSpace
  }
}
