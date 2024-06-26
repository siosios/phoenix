import DetailsAndEdit from 'web-app-files/src/components/SideBar/Shares/Links/DetailsAndEdit.vue'
import { LinkShare, ShareRole } from '@ownclouders/web-client'
import { defaultPlugins, shallowMount, defaultComponentMocks } from 'web-test-helpers'
import { mock } from 'vitest-mock-extended'
import { useLinkTypes, LinkRoleDropdown } from '@ownclouders/web-pkg'
import { SharingLinkType } from '@ownclouders/web-client/graph/generated'
import { Resource } from '@ownclouders/web-client'

vi.mock('@ownclouders/web-pkg', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  useLinkTypes: vi.fn()
}))

const exampleLink = {
  displayName: 'Example link',
  webUrl: 'https://some-url.com/abc',
  type: SharingLinkType.View
} as LinkShare

describe('DetailsAndEdit component', () => {
  describe('if user can not edit', () => {
    it('does not render dropdown or edit button', () => {
      const { wrapper } = getShallowMountedWrapper({ isModifiable: false })
      expect(wrapper.find('link-role-dropdown-stub').exists()).toBeFalsy()
      expect(wrapper.find('.edit-drop-trigger').exists()).toBeFalsy()
    })
  })

  describe('if user can edit', () => {
    it('renders dropdown and edit button', () => {
      const { wrapper } = getShallowMountedWrapper()
      expect(wrapper.find('link-role-dropdown-stub').exists()).toBeTruthy()
      expect(wrapper.find('.edit-drop-trigger').exists()).toBeTruthy()
    })
    it('corrently passes the current link type and available types to the role dropdown', () => {
      const linkShare = mock<LinkShare>({ type: 'edit' })
      const availableLinkTypes = [SharingLinkType.View, SharingLinkType.Edit]
      const { wrapper } = getShallowMountedWrapper({ linkShare, availableLinkTypes })
      const drop = wrapper.findComponent<typeof LinkRoleDropdown>('link-role-dropdown-stub')

      expect(drop.props('modelValue')).toEqual(linkShare.type)
      expect(drop.props('availableLinkTypeOptions')).toEqual(availableLinkTypes)
    })
  })

  describe('editOptions computed property', () => {
    it('does not add "add-expiration" option if isAliasLink is true', () => {
      const linkShare = { ...exampleLink }
      linkShare.type = SharingLinkType.Internal
      const { wrapper } = getShallowMountedWrapper({ linkShare })
      expect(wrapper.vm.editOptions.some((option) => option.id === 'add-expiration')).toBe(false)
    })

    it('adds "add-expiration" option if isAliasLink is false', () => {
      const { wrapper } = getShallowMountedWrapper()
      expect(wrapper.vm.editOptions.some((option) => option.id === 'add-expiration')).toBe(true)
    })
  })

  it('renders a button for indirect links', () => {
    const linkShare = mock<LinkShare>({ indirect: true })
    const { wrapper } = getShallowMountedWrapper({ linkShare })
    expect(wrapper.find('.oc-files-file-link-via').exists()).toBeTruthy()
  })

  describe('additional information icons', () => {
    it('renders an icon if the link has a password', () => {
      const linkShare = mock<LinkShare>({ hasPassword: true })
      const { wrapper } = getShallowMountedWrapper({ linkShare })
      expect(wrapper.find('.oc-files-file-link-has-password').exists()).toBeTruthy()
    })
    it('renders an icon if the link has an expiration date', () => {
      const linkShare = mock<LinkShare>({ expirationDateTime: 'Wed Apr 01 2020' })
      const { wrapper } = getShallowMountedWrapper({ linkShare })
      expect(wrapper.find('.oc-files-public-link-expires').exists()).toBeTruthy()
    })
  })
})

function getShallowMountedWrapper({
  linkShare = exampleLink,
  isModifiable = true,
  availableLinkTypes = [SharingLinkType.View]
}: {
  linkShare?: LinkShare
  isModifiable?: boolean
  availableLinkTypes?: SharingLinkType[]
} = {}) {
  vi.mocked(useLinkTypes).mockReturnValue(
    mock<ReturnType<typeof useLinkTypes>>({
      getAvailableLinkTypes: () => availableLinkTypes,
      getLinkRoleByType: () => mock<ShareRole>({ displayName: '', description: '', label: '' })
    })
  )

  const mocks = defaultComponentMocks()
  return {
    wrapper: shallowMount(DetailsAndEdit, {
      props: {
        canRename: true,
        expirationRules: {
          enforced: false,
          default: null,
          min: 'Wed Apr 01 2020 00:00:00 GMT+0000 (Coordinated Universal Time)',
          max: null
        },
        linkShare,
        isModifiable,
        isPasswordEnforced: false
      },
      global: {
        mocks,
        renderStubDefaultSlot: true,
        stubs: { OcDatepicker: false, 'date-picker': true },
        plugins: [...defaultPlugins()],
        provide: { ...mocks, resource: mock<Resource>({ path: '/' }) }
      }
    })
  }
}
