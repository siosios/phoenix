import { Capabilities, GetCapabilitiesFactory } from './capabilities'
import { AxiosInstance } from 'axios'
import { UrlSign } from './urlSign'

export * from './capabilities'

export interface OCS {
  getCapabilities: () => Promise<Capabilities>
  signUrl: (url: string, username: string) => Promise<string>
}

export const ocs = (baseURI: string, axiosClient: AxiosInstance): OCS => {
  const url = new URL(baseURI)
  url.pathname = [...url.pathname.split('/'), 'ocs', 'v1.php'].filter(Boolean).join('/')
  const ocsV1BaseURI = url.href

  const capabilitiesFactory = GetCapabilitiesFactory(ocsV1BaseURI, axiosClient)

  const urlSign = new UrlSign({ baseURI, axiosClient })

  return {
    getCapabilities: () => {
      return capabilitiesFactory.getCapabilities()
    },
    signUrl: (url: string, username: string) => {
      return urlSign.signUrl(url, username)
    }
  }
}
