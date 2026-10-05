<template>
  <div ref="root" class="app-dropdown" @focusout="blur">
    <label :id="`${id}-label`" :for="id">{{ label }}</label>
    <button
      :id="id"
      ref="trigger"
      class="dropdown-trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="opened"
      :aria-controls="`${id}-options`"
      :aria-labelledby="`${id}-label`"
      :aria-activedescendant="
        opened ? `${id}-option-${highlighted}` : undefined
      "
      :disabled="disabled"
      @click="toggle"
      @keydown="keydown"
    >
      <span>{{ selected?.label ?? modelValue }}</span
      ><ChevronDown
        :size="17"
        aria-hidden="true"
        :class="{ rotated: opened }"
      />
    </button>
    <ul
      v-if="opened"
      :id="`${id}-options`"
      role="listbox"
      :aria-labelledby="`${id}-label`"
      class="dropdown-options"
      @mousedown.prevent
    >
      <li
        v-for="(option, index) in options"
        :id="`${id}-option-${index}`"
        :key="option.value"
        role="option"
        :aria-selected="option.value === modelValue"
        :data-highlighted="highlighted === index"
        @pointermove="highlighted = index"
        @click="choose(index)"
      >
        <span>{{ option.label }}</span
        ><Check
          v-if="option.value === modelValue"
          :size="17"
          aria-hidden="true"
        />
      </li>
    </ul>
  </div>
</template>
<script lang="ts" src="./AppDropdown.ts"></script>
<style scoped src="./AppDropdown.css"></style>
