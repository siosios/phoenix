import { useAuthStore, useConfigStore } from '@ownclouders/web-pkg'
import { mock } from 'vitest-mock-extended'
import { AuthService } from 'web-runtime/src/services/auth/authService'
import { UserManager } from 'web-runtime/src/services/auth/userManager'
import { RouteLocation, createRouter, createTestingPinia } from 'web-test-helpers/src'

const mockUpdateContext = vi.fn()
console.debug = vi.fn()

vi.mock('web-runtime/src/services/auth/userManager')

const initAuthService = ({ authService, configStore = null, router = null }) => {
  createTestingPinia()
  const authStore = useAuthStore()
  configStore = configStore || useConfigStore()

  authService.initialize(configStore, null, router, null, null, null, authStore, null)
}

describe('AuthService', () => {
  describe('signInCallback', () => {
    it.each([
      ['/', '/', {}],
      ['/?details=sharing', '/', { details: 'sharing' }],
      [
        '/external?contextRouteName=files-spaces-personal&fileId=0f897576',
        '/external',
        {
          contextRouteName: 'files-spaces-personal',
          fileId: '0f897576'
        }
      ]
    ])(
      'parses query params and passes them explicitly to router.replace: %s => %s %s',
      async (url, path, query: any) => {
        const authService = new AuthService()

        Object.defineProperty(authService, 'userManager', {
          value: {
            signinRedirectCallback: vi.fn(),
            getAndClearPostLoginRedirectUrl: () => url
          }
        })

        const router = createRouter()
        const replaceSpy = vi.spyOn(router, 'replace')

        initAuthService({ authService, router })
        await authService.signInCallback()

        expect(replaceSpy).toHaveBeenCalledWith({
          path,
          query
        })
      }
    )
  })

  describe('initializeContext', () => {
    it('when embed mode is disabled and access_token is present, should call updateContext', async () => {
      const authService = new AuthService()

      Object.defineProperty(authService, 'userManager', {
        value: mock<UserManager>({
          getAccessToken: vi.fn().mockResolvedValue('access-token'),
          updateContext: mockUpdateContext
        })
      })

      initAuthService({ authService })

      await authService.initializeContext(mock<RouteLocation>({}))

      expect(mockUpdateContext).toHaveBeenCalledWith('access-token', true)
    })

    it('when embed mode is disabled and access_token is not present, should not call updateContext', async () => {
      const authService = new AuthService()

      Object.defineProperty(authService, 'userManager', {
        value: mock<UserManager>({
          getAccessToken: vi.fn().mockResolvedValue(null),
          updateContext: mockUpdateContext
        })
      })

      initAuthService({ authService })

      await authService.initializeContext(mock<RouteLocation>({}))

      expect(mockUpdateContext).not.toHaveBeenCalled()
    })

    it('when embed mode is enabled, access_token is present but auth is not delegated, should call updateContext', async () => {
      const authService = new AuthService()

      Object.defineProperty(authService, 'userManager', {
        value: mock<UserManager>({
          getAccessToken: vi.fn().mockResolvedValue('access-token'),
          updateContext: mockUpdateContext
        })
      })

      initAuthService({ authService })

      await authService.initializeContext(mock<RouteLocation>({}))

      expect(mockUpdateContext).toHaveBeenCalledWith('access-token', true)
    })

    it('when embed mode is enabled, access_token is present and auth is delegated, should not call updateContext', async () => {
      const authService = new AuthService()

      Object.defineProperty(authService, 'userManager', {
        value: mock<UserManager>({
          getAccessToken: vi.fn().mockResolvedValue('access-token'),
          updateContext: mockUpdateContext
        })
      })

      const configStore = useConfigStore()
      configStore.options = { embed: { enabled: true, delegateAuthentication: true } }
      initAuthService({ authService, configStore })

      await authService.initializeContext(mock<RouteLocation>({}))

      expect(mockUpdateContext).not.toHaveBeenCalled()
    })

    it('when embed mode is disabled, access_token is present and auth is delegated, should call updateContext', async () => {
      const authService = new AuthService()

      Object.defineProperty(authService, 'userManager', {
        value: mock<UserManager>({
          getAccessToken: vi.fn().mockResolvedValue('access-token'),
          updateContext: mockUpdateContext
        })
      })

      initAuthService({ authService })

      await authService.initializeContext(mock<RouteLocation>({}))

      expect(mockUpdateContext).toHaveBeenCalledWith('access-token', true)
    })
  })
})
