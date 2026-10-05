<template>
  <div class="workspace" :class="{ 'editor-open': editor.opened }">
    <a class="skip-link" href="#entries-main">{{
      text.heading[list.filter]
    }}</a>
    <aside class="workspace-nav">
      <RouterLink class="workspace-brand" to="/"
        ><AudioLines :size="27" aria-hidden="true" />{{
          text.brand
        }}</RouterLink
      >
      <p class="nav-caption">{{ text.subtitle }}</p>
      <nav aria-label="Contenido">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          class="nav-item"
          :aria-current="list.filter === filter ? 'page' : undefined"
          @click="list.choose(filter)"
        >
          <Layers
            v-if="filter === 'all'"
            :size="19"
            aria-hidden="true"
          /><FileText
            v-else-if="filter === 'notes'"
            :size="19"
            aria-hidden="true"
          /><CircleCheck v-else :size="19" aria-hidden="true" />{{
            text[filter]
          }}
        </button>
      </nav>
      <div class="nav-account">
        <p class="account-name">{{ session.user?.name }}</p>
        <p class="account-email">{{ session.user?.email }}</p>
        <span class="verified-badge">{{ text.verified }}</span
        ><button
          class="logout-button"
          :disabled="loggingOut || editor.busy"
          @click="logout"
        >
          <LogOut :size="16" aria-hidden="true" />{{ text.logout }}
        </button>
      </div>
    </aside>
    <main id="entries-main" class="workspace-body">
      <header class="workspace-toolbar">
        <div>
          <p class="section-eyebrow">{{ text.brand }}</p>
          <h1>{{ text.heading[list.filter] }}</h1>
        </div>
        <div class="create-actions">
          <button
            id="new-note"
            class="primary-button"
            :disabled="editor.busy"
            @click="editor.create('note')"
          >
            <Plus :size="17" aria-hidden="true" />{{ text.newNote }}</button
          ><button
            class="secondary-button"
            :disabled="editor.busy"
            @click="editor.create('task')"
          >
            {{ text.newTask }}
          </button>
        </div>
      </header>
      <p v-if="notice" class="workspace-notice" role="status">{{ notice }}</p>
      <p v-if="actionError" class="notice error" role="alert">
        {{ actionError }}
      </p>
      <div class="workspace-panes">
        <section class="entries-panel" :aria-label="text.heading[list.filter]">
          <form class="search-form" role="search" @submit.prevent="list.find">
            <label class="sr-only" for="entries-search">{{
              text.searchLabel
            }}</label
            ><SearchIcon :size="19" aria-hidden="true" /><input
              id="entries-search"
              v-model="list.search"
              type="search"
              maxlength="200"
              :placeholder="text.searchPlaceholder"
            /><button class="search-submit" type="submit">
              {{ text.search }}
            </button>
          </form>
          <div class="list-meta">
            <span>{{ list.total }} {{ text.results }}</span
            ><button
              v-if="list.query"
              class="text-button"
              @click="list.resetSearch"
            >
              {{ text.clearSearch }}</button
            ><button
              class="icon-button"
              :aria-label="text.refresh"
              :disabled="list.loading"
              @click="list.load"
            >
              <RefreshCw :size="17" aria-hidden="true" />
            </button>
          </div>
          <p v-if="list.loading" class="list-message" role="status">
            {{ text.loading }}
          </p>
          <div v-else-if="list.error" class="list-message">
            <p class="notice error" role="alert">{{ list.error }}</p>
            <button class="secondary-button" @click="list.load">
              {{ text.retry }}
            </button>
          </div>
          <div v-else-if="!list.rows.length" class="empty-state">
            <NotebookPen :size="36" aria-hidden="true" />
            <h2>
              {{
                list.query || list.filter !== 'all'
                  ? text.noResults
                  : text.emptyTitle
              }}
            </h2>
            <p>
              {{
                list.query || list.filter !== 'all'
                  ? text.noResultsText
                  : text.emptyText
              }}
            </p>
          </div>
          <ul v-else class="entry-list">
            <li
              v-for="entry in list.rows"
              :key="entry.id"
              class="entry-row"
              :class="{
                selected: editor.current?.id === entry.id,
                done: !!entry.completed_at,
              }"
            >
              <button
                v-if="entry.kind === 'task'"
                class="completion-button"
                role="checkbox"
                :aria-checked="!!entry.completed_at"
                :aria-label="`${entry.completed_at ? text.reopen : text.complete}: ${entry.title}`"
                :title="
                  !canComplete(entry) ? text.saveBeforeComplete : undefined
                "
                :disabled="!canComplete(entry)"
                @click="complete(entry)"
              >
                <Check
                  v-if="entry.completed_at"
                  :size="15"
                  aria-hidden="true"
                /></button
              ><span v-else class="note-icon"
                ><FileText :size="19" aria-hidden="true"
              /></span>
              <button
                class="entry-open"
                :aria-pressed="editor.current?.id === entry.id"
                :disabled="editor.busy"
                @click="editor.open(entry)"
              >
                <span class="row-heading"
                  ><span class="row-title">{{ entry.title }}</span
                  ><time :datetime="entry.updated_at">{{
                    date(entry.updated_at)
                  }}</time></span
                ><span class="row-preview">{{
                  entry.description ||
                  (entry.kind === 'note' ? text.note : text.task)
                }}</span
                ><span class="row-kind">{{
                  entry.kind === 'note'
                    ? text.note
                    : entry.completed_at
                      ? text.completedLabel
                      : text.pendingLabel
                }}</span>
              </button>
            </li>
          </ul>
          <nav
            v-if="list.lastPage > 1"
            class="pagination"
            aria-label="Paginación"
          >
            <button
              class="secondary-button"
              :disabled="list.loading || list.page <= 1"
              @click="list.go(list.page - 1)"
            >
              {{ text.previous }}</button
            ><span
              >{{ text.page }} {{ list.page }} {{ text.of }}
              {{ list.lastPage }}</span
            ><button
              class="secondary-button"
              :disabled="list.loading || list.page >= list.lastPage"
              @click="list.go(list.page + 1)"
            >
              {{ text.next }}
            </button>
          </nav>
        </section>
        <EntryEditor v-if="editor.opened" :editor="editor" />
        <aside v-else class="editor-empty">
          <AudioLines :size="44" aria-hidden="true" />
          <h2>{{ text.selectTitle }}</h2>
          <p>{{ text.selectText }}</p>
        </aside>
      </div>
    </main>
  </div>
</template>
<script lang="ts" src="./EntriesWorkspace.ts"></script>
<style scoped src="./EntriesWorkspace.css"></style>
