---
title: 'Extension system'
date: 2024-01-23T00:00:00+00:00
weight: 60
geekdocRepo: https://github.com/owncloud/web
geekdocEditPath: edit/master/docs/extension-system
geekdocFilePath: _index.md
geekdocCollapseSection: true
---

{{< toc >}}

## Concepts and Building Blocks

The ownCloud Web can be extended through various entry points with custom **apps** and **extensions**.

### Distinction between Apps and Extensions

An Application in the context of ownCloud Web is an artifact which can be installed in an ownCloud Infinite Scale instance.
It serves two main purposes:
1. It makes the full app viewport (everything below the top bar) available to the application developer for any custom
   application code. This includes the ability to define views with routes, navigation items for the left sidebar, and more.
2. Through the `extensions` key in the application interface you can register extensions of any extension type. Those extensions 
   are then available in standardized extension points. Additionally, they can be queried from the extension registry for 
   your own purposes.

Both parts are optional. This means that an application can be a file editor without any custom extensions, or even contain
no custom application code at all and only host extensions to be registered in the extension registry, or a combination of both.

### Apps

To get started, define a `src/index.ts`. Below is the most basic example of its content:

```typescript
// Install '@ownclouders/web-pkg' as a devDependency first (only relevant for types and autocompletion, dependency is already provided by ownCloud Web at runtime). 
import {
  AppWrapperRoute,
  ApplicationFileExtension,
  defineWebApplication
} from '@ownclouders/web-pkg'


export default defineWebApplication({
  setup({ applicationConfig }) {
    // Here, you have access to the full injection context, meaning you can use all composables that we provide via web-pkg

    // Needs to be unique within all installed applications in any ownCloud web instance
    // Should be short, unique and expressive as it is used as prefix on all routes within your application
    const appId = 'your-extension' 

    // See extensions section below
    const extensions = [
        ...
    ]

    // See details below
    const navItems = [
      ...
    ]

    // See details below
    const routes = [
        ...
    ]

    return {
      appInfo: {
        name: $gettext('Your application name'),
        id: appId,
        icon: 'aliens', // See https://owncloud.design/#/Design%20Tokens/IconList for available options
      },
      extensions,
      navItems,
      routes
    }
  }
})
```

By defining an application via `defineWebApplication` you can provide the following:
- `appInfo` - the application metadata, which is used to make the application available via the app switcher and the app registry.
- `navItems` - the statically defined navigation items for the left sidebar. Only gets rendered when more than 1 navigation item exists at runtime. 
Additional dynamic navigation items can be registered via the extension registry.
- `routes` - the routes to the different views of your application. May be referenced within the `navItems`. Authentication requirements can be defined per item.
- `extensions` - the extensions to be registered in the extension registry. For more details see the `Extensions` section below.

If you want to learn how to implement an app for viewing and editing specific file types, please consult the [relevant documentation]({{< ref "viewer-editor-apps.md" >}}) for detailed instructions and guidance.

To learn how to integrate an app into ownCloud Web, please refer to the "Web Apps" section of the Web service docs ("Services" > "Web").

### Extensions

In contrast to applications, extensions usually have a rather small scope and dedicated functionality.

#### Extension Registry

The globally available extension registry provided by the ownCloud Web runtime can be used to both register and query extensions. All extensions
which are being made available via an `app` get registered in the extension registry automatically. In your custom application code you can
then query any of the available extensions by providing a `type` string and optionally a list of `scopes`. Throughout the ownCloud Web platform
and most prominently also in the `files` app we have defined some extension points which automatically use certain extensions, see the 
`Extension Points` section below.

#### Extension Types

For building an extension you can choose from the types predefined by the ownCloud Web extension system. See the full list of available extension types below.

1. `ActionExtension` (type `action`) - An extension that can register `Action` items which then get shown in various places (e.g. context menus, batch actions), depending on their 
respective scope. Most commonly used for file and folder actions (e.g. copy, rename, delete, etc.). For details, please refer to the [action docs]({{< ref "extension-types/actions.md" >}})
2. `SearchExtension` (type `search`) - An extension that can register additional search providers. For details, please refer to the [search docs]({{< ref "extension-types/search.md" >}})
3. `SidebarNavExtension` (type `sidebarNav`) - An extension that can register additional navigation items to the left sidebar. These can be scoped to specific apps, and programmatically enabled/disabled.
For details, please refer to the [sidebar nav docs]({{< ref "extension-types/left-sidebar-menu-item.md" >}})
4. `SidebarPanelExtension`, (type `sidebarPanel`) - An extension that can register panels to the right sidebar. For details, please refer to the [sidebar panel docs]({{< ref "extension-types/right-sidebar-panels.md" >}})
5. `FolderViewExtension` (type `folderView`) - An extension that can register additional ways of displaying the content of a folder (resources, so spaces, folders or files) to the user.
For details, please refer to the [folder view docs]({{< ref "extension-types/folder-view.md" >}})
6. `CustomComponentExtension` (type `customComponent`) - An extension that can register a custom component for a render target. For details, please refer to the
[custom component docs]({{< ref "extension-types/custom-components.md" >}})

You're free to introduce your own extension types within your application code and use the extension registry to query the available ones. However, if you have the impression
that an important extension type is missing and would be beneficial for the platform, please reach out to us by opening a [GitHub issue](https://github.com/owncloud/web/issues/new/choose).

#### Extension Base Configuration

Any extension is required to define at least an `id` and a `type`.

The `id` is supposed to be unique throughout the ownCloud Web ecosystem. In order to keep `id`s readable for humans we didn't want to enforce uniqueness through e.g. uuids. 
Instead, we chose to use dot-formatted namespaces like e.g. `com.github.owncloud.web.files.search`. We'd like to encourage you to follow the same format for your own extensions.

For the `type` you can choose from the ones listed above or define a custom one.

In addition, you can also pass optional `extensionPointIds` to further limit the usage of an extension. With the right click context menu and the batch actions being
two different extension points, this could mean that a file action extension is only allowed in the context menu, but not in the batch actions.
You can find predefined extension point ids in the extension points section below.

#### Extension Points

There are standardized components and places where extensions are being used automatically. The following are the ones that are currently provided
by the ownCloud Web runtime or the `files` app.

1. Left Sidebar for Navigation
2. Right Sidebar in any file(s) context 
3. Folder Views in the files app 
4. Right click context menu in the files app 
5. Batch actions in the files app
6. Upload menu in the files app 
7. Quick actions in the files list of the files app
8. Search results in the search app
9. Global progress bar for the global loading state. Extension point id `app.runtime.global-progress-bar`. Allows to render a single custom component.

#### User Preferences for Extensions

To allow users to configure extensions, extension points can define user preferences. User preferences are defined as an object on the extension point configuration.
Whenever an extension point declares to accept user preferences, it will get listed with a dropdown on the Preferences page (reachable via top right user menu).
The user can then select one out of all the extensions which have been registered for this extension point. 
