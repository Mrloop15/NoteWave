<template>
  <div class="audio-preview" role="group" :aria-label="text.audio">
    <audio
      ref="audio"
      :src="src"
      preload="metadata"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @timeupdate="update"
      @loadedmetadata="update"
    />
    <button
      type="button"
      class="audio-play"
      :aria-label="playing ? text.pause : text.play"
      @click="toggle"
    >
      <Pause v-if="playing" :size="18" aria-hidden="true" /><Play
        v-else
        :size="18"
        aria-hidden="true"
      />
    </button>
    <div class="audio-track">
      <div class="audio-caption">
        <AudioLines :size="15" aria-hidden="true" /><span>{{
          text.recording
        }}</span
        ><span class="audio-time">{{ time(elapsed) }} / {{ time(total) }}</span>
      </div>
      <progress :value="elapsed" :max="total" :aria-label="text.progress" />
    </div>
    <button
      type="button"
      class="audio-stop"
      :aria-label="text.stop"
      @click="stop"
    >
      <Square :size="16" aria-hidden="true" />
    </button>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script lang="ts" src="./AudioPreview.ts"></script>
<style scoped src="./AudioPreview.css"></style>
