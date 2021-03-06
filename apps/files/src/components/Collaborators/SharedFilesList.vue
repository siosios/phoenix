<template>
  <file-list
    id="files-list"
    :file-data="fileData"
    :loading="loadingFolder"
    :actions="actions"
    :compact-mode="_sidebarOpen"
    :is-action-enabled="isActionEnabled"
  >
    <template #headerColumns>
      <div class="uk-text-truncate uk-text-meta uk-width-expand">
        <sortable-column-header
          :aria-label="$gettext('Sort files by name')"
          :is-active="fileSortField == 'name'"
          :is-desc="fileSortDirectionDesc"
          @click="toggleSort('name')"
        >
          <translate translate-context="Name column in files table">Name</translate>
        </sortable-column-header>
      </div>
      <div
        v-if="!$_isSharedWithMe"
        key="shared-with-header-cell"
        class="uk-visible@s uk-text-nowrap uk-text-meta uk-width-medium uk-text-right"
        translate-context="Collaborators table column"
        v-text="$gettext('Collaborators')"
      />
      <div
        v-else
        v-translate
        shrink
        type="head"
        class="uk-text-nowrap uk-text-meta uk-width-small uk-text-right"
      >
        Status
      </div>
      <div
        v-if="$route.name === 'files-shared-with-me'"
        key="shared-with-header-cell"
        class="uk-visible@s uk-text-nowrap uk-text-meta uk-width-small uk-text-right"
        translate-context="Owner table column"
        v-text="$gettext('Owner')"
      />
      <div class="uk-visible@s uk-text-nowrap uk-text-meta uk-width-small">
        <sortable-column-header
          :aria-label="$gettext('Sort files by share time')"
          :is-active="fileSortField == 'shareTimeMoment'"
          :is-desc="fileSortDirectionDesc"
          class="uk-align-right"
          @click="toggleSort('shareTimeMoment')"
        >
          <translate translate-context="Share time column in files table">Share time</translate>
        </sortable-column-header>
      </div>
      <div class="oc-icon" />
    </template>
    <template #rowColumns="{ item }">
      <div class="uk-width-expand">
        <file-item
          :key="item.path"
          :item="item"
          @click.native.stop="
            item.type === 'folder' ? navigateTo(item.path.substr(1)) : openFileActionBar(item)
          "
        />
        <oc-spinner
          v-if="actionInProgress(item)"
          size="small"
          :uk-tooltip="disabledActionTooltip(item)"
          class="uk-margin-small-left"
        />
      </div>
      <div
        v-if="!$_isSharedWithMe"
        key="shared-with-cell"
        class="uk-visible@s uk-text-meta uk-text-nowrap uk-text-truncate uk-width-medium uk-flex file-row-collaborators uk-flex-right"
      >
        <span
          v-for="share in prepareCollaborators(item.shares)"
          :key="share.id"
          class="uk-margin-small-right uk-flex uk-flex-middle"
        >
          <avatar-image
            v-if="share.shareType === shareTypes.user && share.collaborator"
            :key="'avatar-' + share.id"
            class="uk-margin-xsmall-right"
            :width="24"
            :userid="share.collaborator.name"
            :user-name="share.collaborator.displayName"
          />
          <oc-icon
            v-else
            :key="'icon-' + share.id"
            :name="$_shareTypeIcon(share.shareType)"
            class="uk-margin-xsmall-right"
            size="small"
            variation="active"
            aria-hidden="true"
          />
          <span
            v-if="share.collaborator"
            :key="'collaborator-name-' + share.id"
            class="file-row-collaborator-name"
            v-text="share.collaborator.displayName"
          />
          <translate
            v-if="share.shareType === shareTypes.link"
            :key="'collaborator-name-public-' + share.id"
            class="file-row-collaborator-name"
            translate-context="Short public link indicator"
            >Public</translate
          >
        </span>
      </div>
      <div v-else :key="item.id + item.status" class="uk-text-nowrap">
        <a
          v-if="item.status === 1 || item.status === 2"
          v-translate
          class="file-row-share-status-action uk-text-meta"
          @click="pendingShareAction(item, 'POST')"
          >Accept</a
        >
        <a
          v-if="item.status === 1"
          v-translate
          class="file-row-share-status-action uk-text-meta uk-margin-left"
          @click="pendingShareAction(item, 'DELETE')"
          >Decline</a
        >
        <span
          class="uk-text-small uk-margin-left file-row-share-status-text"
          v-text="shareStatus(item.status)"
        />
      </div>
      <div
        v-if="$_isSharedWithMe"
        key="shared-from-cell"
        class="uk-visible@s uk-text-meta uk-text-nowrap uk-text-truncate uk-width-small uk-flex uk-flex-middle file-row-collaborators uk-flex-right"
      >
        <avatar-image
          class="uk-margin-xsmall-right"
          :width="24"
          :userid="item.shareOwner.username"
          :user-name="item.shareOwner.displayName"
        />
        <span class="file-row-owner-name" v-text="item.shareOwner.displayName" />
      </div>
      <div
        class="uk-visible@s uk-text-meta uk-text-nowrap uk-width-small uk-text-right"
        v-text="formDateFromNow(item.shareTime)"
      />
    </template>
    <template #noContentMessage>
      <no-content-message icon="group">
        <template #message>
          <span v-if="$_isSharedWithMe" v-translate
            >You are currently not collaborating on other people's resources.</span
          >
          <span v-else v-translate
            >You are currently not collaborating on any of your resources with other people.</span
          >
        </template>
      </no-content-message>
    </template>
  </file-list>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Mixins from '../../mixins'
import FileActions from '../../fileactions'
import FileList from '../FileList.vue'
import FileItem from '../FileItem.vue'
import NoContentMessage from '../NoContentMessage.vue'
import SortableColumnHeader from '../FilesLists/SortableColumnHeader.vue'
import { shareTypes } from '../../helpers/shareTypes'
import { textUtils } from '../../helpers/textUtils'

export default {
  name: 'SharedFilesList',
  components: {
    FileList,
    FileItem,
    NoContentMessage,
    SortableColumnHeader
  },
  mixins: [Mixins, FileActions],
  props: {
    /**
     * Array of active files
     */
    fileData: {
      type: Array,
      required: true,
      default: null
    }
  },
  computed: {
    ...mapGetters('Files', ['loadingFolder']),

    shareTypes() {
      return shareTypes
    },

    $_isSharedWithMe() {
      return this.$route.name === 'files-shared-with-me'
    }
  },
  watch: {
    $route() {
      if (this.$route.name === 'files-shared-with-me') {
        this.$_ocSharedWithMe_getFiles()
      } else {
        this.$_ocSharedFromMe_getFiles()
      }
    }
  },
  beforeMount() {
    if (this.$route.name === 'files-shared-with-me') {
      this.$_ocSharedWithMe_getFiles()
    } else {
      this.$_ocSharedFromMe_getFiles()
    }
  },
  methods: {
    ...mapActions('Files', [
      'loadFolderSharedFromMe',
      'loadFolderSharedWithMe',
      'setFilterTerm',
      'pendingShare'
    ]),

    /**
     * Prepare the given collaboratoes list for display.
     * Sorts first by share type (user, group, link, remote)
     * and then by the collaborator's display name using natural
     * sort. Public links entries are deduplicated into a single
     * one in order to only show "Public" once even when
     * there are multiple link shares.
     *
     * @param {Array.<Object>} shares shares to sort
     * @return {Array.<Object>} sorted shares
     */
    prepareCollaborators(shares) {
      let hasLink = false
      const results = []
      shares.forEach(share => {
        if (share.shareType === shareTypes.link) {
          if (!hasLink) {
            results.push(share)
            hasLink = true
          }
        } else {
          results.push(share)
        }
      })
      return results.sort((s1, s2) => {
        if (s1.shareType !== s2.shareType) {
          // sort by share type: user, group, link, remote
          return s1.shareType - s2.shareType
        }
        if (!s1.collaborator) {
          return 0
        }
        return textUtils.naturalSortCompare(
          s1.collaborator.displayName,
          s2.collaborator.displayName
        )
      })
    },

    $_shareTypeIcon(type) {
      switch (type) {
        case shareTypes.user:
          return 'person'
        case shareTypes.group:
          return 'group'
        case shareTypes.link:
          return 'link'
      }
    },

    $_ocSharedFromMe_getFiles() {
      this.loadFolderSharedFromMe({
        client: this.$client,
        $gettext: this.$gettext
      })
    },

    $_ocSharedWithMe_getFiles() {
      this.loadFolderSharedWithMe({
        client: this.$client,
        $gettext: this.$gettext
      })
    },

    isActionEnabled(item, action) {
      return action.isEnabled(item, null)
    },

    shareStatus(status) {
      if (status === 0) return

      if (status === 1) return this.$gettext('Pending')

      if (status === 2) return this.$gettext('Declined')
    },

    pendingShareAction(item, type) {
      this.pendingShare({
        client: this.$client,
        item: item,
        type: type,
        $gettext: this.$gettext
      })
    }
  }
}
</script>
