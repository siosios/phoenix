<template>
  <div id="files" class="uk-flex uk-flex-column">
    <files-app-bar />
    <upload-progress
      v-show="$_uploadProgressVisible"
      class="uk-padding-small uk-background-muted"
    />
    <oc-grid class="uk-height-1-1 uk-flex-1 uk-overflow-auto">
      <div
        ref="filesListWrapper"
        tabindex="-1"
        class="uk-width-expand uk-overflow-auto uk-height-1-1 files-list-wrapper"
        :class="{ 'uk-visible@m': _sidebarOpen }"
        @dragover="$_ocApp_dragOver"
      >
        <oc-loader v-if="loadingFolder" id="files-list-progress"></oc-loader>
        <trash-bin v-if="$route.name === 'files-trashbin'" :file-data="activeFiles" />
        <shared-files-list
          v-else-if="sharedList"
          :file-data="activeFiles"
          @sideBarOpen="openSideBar"
        />
        <all-files-list
          v-else
          :file-data="activeFiles"
          :parent-folder="currentFolder"
          @FileAction="openFileActionBar"
          @sideBarOpen="openSideBar"
        />
      </div>
      <file-details
        v-if="_sidebarOpen && $route.name !== 'files-trashbin'"
        class="uk-width-1-1 uk-width-1-2@m uk-width-1-3@xl uk-height-1-1"
        @reset="setHighlightedFile(null)"
      />
    </oc-grid>
    <file-open-actions />
  </div>
</template>
<script>
import Mixins from '../mixins'
import FileActions from '../fileactions'
import FileDetails from './FileDetails.vue'
import FilesAppBar from './FilesAppBar.vue'
import AllFilesList from './AllFilesList.vue'
import TrashBin from './Trashbin.vue'
import SharedFilesList from './Collaborators/SharedFilesList.vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import FileOpenActions from './FileOpenActions.vue'
const UploadProgress = () => import('./UploadProgress.vue')

export default {
  components: {
    FileDetails,
    AllFilesList,
    FilesAppBar,
    FileOpenActions,
    TrashBin,
    SharedFilesList,
    UploadProgress
  },
  mixins: [Mixins, FileActions],
  data() {
    return {
      createFolder: false,
      fileUploadName: '',
      fileUploadProgress: 0,
      upload: false,
      fileName: '',
      selected: [],
      breadcrumbs: []
    }
  },
  computed: {
    ...mapGetters('Files', [
      'selectedFiles',
      'activeFiles',
      'dropzone',
      'loadingFolder',
      'highlightedFile',
      'currentFolder',
      'inProgress'
    ]),
    ...mapGetters(['extensions']),

    _sidebarOpen() {
      return this.highlightedFile !== null
    },

    sharedList() {
      return (
        this.$route.name === 'files-shared-with-me' ||
        this.$route.name === 'files-shared-with-others'
      )
    },

    $_uploadProgressVisible() {
      return this.inProgress.length > 0
    }
  },
  watch: {
    $route() {
      this.setHighlightedFile(null)
      this.resetFileSelection()
    }
  },
  created() {
    this.$root.$on('upload-end', () => {
      this.delayForScreenreader(() => this.$refs.filesListWrapper.focus())
    })
  },

  beforeDestroy() {
    this.SET_SIDEBAR_FOOTER_CONTENT_COMPONENT(null)
  },

  methods: {
    ...mapActions('Files', ['dragOver', 'setHighlightedFile', 'resetFileSelection']),
    ...mapActions(['openFile', 'showMessage']),
    ...mapMutations('Files', ['SET_CURRENT_SIDEBAR_TAB']),
    ...mapMutations(['SET_SIDEBAR_FOOTER_CONTENT_COMPONENT']),

    trace() {
      console.info('trace', arguments)
    },

    openFileActionBar(file) {
      this.openFile({
        filePath: file.path
      })
      let actions = this.extensions(file.extension.toLowerCase())
      actions = actions.map(action => {
        if (action.version === 3) {
          return {
            label: action.title[this.$language.current] || action.title.en,
            iconUrl: action.icon,
            onClick: () => {
              this.openFileAction(action, file)
            }
          }
        }
        return {
          label: action.name,
          icon: action.icon,
          onClick: () => {
            this.openFileAction(action, file.path)
          }
        }
      })
      actions.push({
        label: this.$gettext('Download'),
        icon: 'file_download',
        onClick: () => {
          this.downloadFile(file)
        }
      })

      this.$root.$emit('oc-file-actions:open', {
        filename: file.name,
        actions: actions
      })
    },

    openSideBar(file, sideBarName) {
      this.setHighlightedFile(file)
      setTimeout(() => {
        this.SET_CURRENT_SIDEBAR_TAB({ tab: sideBarName })
      })
    },

    $_ocApp_dragOver() {
      this.dragOver(true)
    },

    $_ocAppSideBar_onReload() {
      this.$refs.filesList.$_ocFilesFolder_getFolder()
    }
  }
}
</script>

<style scoped>
.files-list-wrapper:focus {
  outline: none;
}
</style>
