<template>
  <div>
    <oc-search-bar
      ref="globalSearchBar"
      class="uk-width-large uk-visible@m"
      :label="searchLabel"
      :loading="isLoadingSearchResults"
      :button-hidden="true"
      @search="search"
      @clear="resetSearch"
    />
    <oc-button
      id="files-open-search-btn"
      key="mobile-search-button"
      class="uk-hidden@m"
      icon="search"
      :aria-label="displaySearchButtonLabel"
      @click="focusMobileSearchInput"
    />
    <oc-drop
      drop-id="oc-topbar-search-mobile"
      toggle="#files-open-search-btn"
      mode="click"
      class="uk-margin-remove"
      :options="{ delayHide: '0' }"
    >
      <oc-search-bar
        ref="mobileSearch"
        :label="searchLabel"
        :loading="isLoadingSearchResults"
        @search="search"
        @clear="resetSearch"
      />
    </oc-drop>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'SearchBar',

  data: () => ({
    isLoadingSearchResults: false
  }),

  computed: {
    searchLabel() {
      return this.$gettext('Search')
    },

    displaySearchButtonLabel() {
      return this.$gettext('Open search bar')
    }
  },

  watch: {
    $route() {
      this.clearSearchBarValue()
    }
  },

  methods: {
    ...mapActions('Files', ['searchForFile', 'resetSearch']),

    search(searchTerm) {
      if (!searchTerm) {
        this.resetSearch()

        return
      }

      this.isLoadingSearchResults = true

      this.searchForFile({
        searchTerm,
        client: this.$client
      })
        .catch(e => {
          this.showMessage({
            title: this.$gettext('Search failed'),
            desc: e.message,
            status: 'danger'
          })
        })
        .finally(() => {
          this.isLoadingSearchResults = false
        })
    },

    clearSearchBarValue() {
      const searchBarRef = this.$refs.globalSearchBar
        ? this.$refs.globalSearchBar
        : this.$refs.mobileSearch

      searchBarRef.query = ''
    },

    focusMobileSearchInput() {
      // Set focus after the element is rendered visible
      // nextTick is not enough here
      setTimeout(() => {
        this.$refs.mobileSearch.$el.querySelector('input').focus()
      }, 50)
    }
  }
}
</script>
