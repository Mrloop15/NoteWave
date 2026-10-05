<template>
  <section class="dictation-panel" aria-labelledby="dictation-heading">
    <h3 id="dictation-heading">
      <Mic :size="17" aria-hidden="true" />{{ text.heading }} <span>Demo</span>
    </h3>
    <p class="dictation-info">{{ text.demo }}</p>
    <p v-if="!voice.supported" class="dictation-info">{{ text.unsupported }}</p>
    <template v-else-if="voice.options?.enabled">
      <AppDropdown
        id="dictation-language"
        v-model="voice.language"
        :label="text.language"
        :options="[
          { value: 'es', label: text.spanish },
          { value: 'en', label: text.english },
        ]"
        :disabled="voice.active || disabled"
      />
      <p class="dictation-info">{{ text.limit }}</p>
      <p
        v-if="
          voice.state !== 'idle' &&
          voice.state !== 'ready' &&
          voice.state !== 'failed'
        "
        role="status"
      >
        {{ text[voice.state]
        }}<span v-if="voice.state === 'recording'">
          · {{ voice.seconds }} s</span
        >
      </p>
      <AudioPreview
        v-if="voice.playback"
        :src="voice.playback"
        :seconds="voice.seconds"
      />
      <div v-if="voice.state === 'ready'" class="dictation-review">
        <label for="dictation-result">{{ text.review }}</label>
        <textarea
          id="dictation-result"
          v-model="voice.transcript"
          rows="5"
          maxlength="20000"
        />
      </div>
      <div class="dictation-actions">
        <button
          v-if="!voice.active && !voice.jobId"
          type="button"
          class="secondary-button"
          :disabled="disabled"
          @click="start"
        >
          <Mic :size="16" aria-hidden="true" />{{ text.start }}
        </button>
        <button
          v-if="voice.state === 'recording'"
          type="button"
          class="secondary-button"
          @click="voice.stop"
        >
          <Square :size="16" aria-hidden="true" />{{ text.stop }}
        </button>
        <button
          v-if="voice.state === 'recorded'"
          type="button"
          class="secondary-button"
          @click="voice.send"
        >
          <Send :size="16" aria-hidden="true" />{{
            voice.error ? text.retry : text.send
          }}
        </button>
        <button
          v-if="voice.state === 'failed' && voice.jobId"
          type="button"
          class="secondary-button"
          @click="voice.poll()"
        >
          {{ text.resume }}
        </button>
        <button
          v-if="voice.state === 'ready'"
          type="button"
          class="secondary-button"
          :disabled="disabled || !voice.transcript.trim()"
          @click="insert"
        >
          <Plus :size="16" aria-hidden="true" />{{ text.insert }}
        </button>
        <button
          v-if="voice.active || voice.jobId"
          type="button"
          class="text-button"
          @click="voice.discard"
        >
          <X :size="16" aria-hidden="true" />{{ text.cancel }}
        </button>
      </div>
    </template>
    <p v-else class="dictation-info">{{ text.unavailable }}</p>
    <p v-if="voice.error" class="notice error" role="alert">
      {{ voice.error }}
    </p>
    <p v-if="notice" role="status">{{ notice }}</p>
  </section>
</template>
<script lang="ts" src="./DictationPanel.ts"></script>
<style scoped src="./DictationPanel.css"></style>
