import { createLocalVue, mount } from '@vue/test-utils'
import filterSearch from './filterSearch.js'

// create an extended `Vue` constructor
const localVue = createLocalVue()

// install plugins as normal
localVue.mixin(filterSearch)

const MockComponent = {
  name: 'example',
  status: 'prototype',
  template:
    "<div class='container'><div class='rsg--search-11'><input type='text' value='' /></div><div class='rsg--sidebar-23'><ul><ul class='rsg--list-23 test'></ul></ul></div></div>"
}

const div = document.createElement('div')
document.body.appendChild(div)

const wrapper = mount(MockComponent, {
  attachTo: div,
  localVue
})

describe('filterSearch.js', () => {
  it('should show all links when searching', () => {
    const input = wrapper.find('input')
    const parent = wrapper.find('.test')
    input.value = 'test'
    input.trigger('keydown')
    expect(parent.attributes('class')).toContain('vueds-visible')
  })

  it('should hide all links when the input is cleared', () => {
    const input = wrapper.find('input')
    input.value = ''
    input.trigger('focus')
    input.trigger('input')
    input.trigger('blur')

    const visibleItem = wrapper.find('.vueds-visible')
    expect(visibleItem.exists()).toBe(false)
  })
})
