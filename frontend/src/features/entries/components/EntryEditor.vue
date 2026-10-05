<template>
  <aside
    class="entry-editor"
    aria-labelledby="editor-heading"
    :aria-busy="editor.loading || editor.busy"
  >
    <header class="editor-top">
      <span class="editor-kind"
        ><FileText
          v-if="editor.draft.kind === 'note'"
          :size="18"
          aria-hidden="true"
        /><CircleCheck v-else :size="18" aria-hidden="true" />{{
          editor.draft.kind === 'note' ? text.note : text.task
        }}</span
      ><button
        type="button"
        class="icon-button"
        :aria-label="text.close"
        :disabled="editor.busy"
        @click="editor.close"
      >
        <X :size="21" aria-hidden="true" />
      </button>
    </header>
    <h2 id="editor-heading">
      {{
        editor.current
          ? editor.current.title
          : editor.draft.kind === 'note'
            ? text.newNote
            : text.newTask
      }}
    </h2>
    <p v-if="editor.loading" role="status">{{ text.loading }}</p>
    <form @submit.prevent="editor.save()">
      <fieldset :disabled="editor.busy || editor.loading">
        <div class="field">
          <label for="entry-title">{{ text.title }}</label
          ><input
            id="entry-title"
            :value="editor.draft.title"
            :placeholder="text.titlePlaceholder"
            maxlength="200"
            required
            :aria-invalid="!!editor.fields.title"
            :aria-describedby="
              editor.fields.title ? 'entry-title-error' : undefined
            "
            @input="input('title', $event)"
          /><span
            v-if="editor.fields.title"
            id="entry-title-error"
            class="field-error"
            >{{ editor.fields.title }}</span
          >
        </div>
        <div class="field description-field">
          <label for="entry-description">{{ text.description }}</label
          ><textarea
            id="entry-description"
            :value="editor.draft.description"
            :placeholder="text.descriptionPlaceholder"
            maxlength="20000"
            rows="12"
            :aria-invalid="!!editor.fields.description"
            :aria-describedby="
              editor.fields.description ? 'entry-description-error' : undefined
            "
            @input="input('description', $event)"
          /><span
            v-if="editor.fields.description"
            id="entry-description-error"
            class="field-error"
            >{{ editor.fields.description }}</span
          >
        </div>
        <p v-if="editor.error" class="notice error" role="alert">
          {{ editor.error }}
        </p>
        <button
          v-if="
            editor.conflict ||
            (editor.error && editor.current && !editor.missing)
          "
          type="button"
          class="secondary-button"
          @click="editor.reload"
        >
          {{ text.reload }}
        </button>
        <button
          v-if="editor.missing"
          type="button"
          class="secondary-button"
          @click="editor.save(true)"
        >
          {{ text.saveCopy }}
        </button>
        <div class="editor-footer">
          <span class="save-state" role="status">{{
            editor.dirty ? text.unsaved : editor.notice
          }}</span
          ><button
            class="primary-button"
            type="submit"
            :disabled="
              (!editor.dirty && !!editor.current) ||
              editor.conflict ||
              editor.missing
            "
          >
            <Save :size="17" aria-hidden="true" />{{
              editor.busy ? text.saving : text.save
            }}
          </button>
        </div>
      </fieldset>
    </form>
    <footer v-if="editor.current" class="editor-bottom">
      <span>{{
        editor.current.kind === 'task'
          ? editor.current.completed_at
            ? text.completedLabel
            : text.pendingLabel
          : text.note
      }}</span
      ><button
        type="button"
        class="delete-button"
        :disabled="editor.busy || editor.loading || editor.missing"
        @click="editor.remove"
      >
        <Trash2 :size="16" aria-hidden="true" />{{ text.delete }}
      </button>
    </footer>
  </aside>
</template>
<script lang="ts" src="./EntryEditor.ts"></script>
<style scoped src="./EntryEditor.css"></style>
