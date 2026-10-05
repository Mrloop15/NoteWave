<template>
  <div class="welcome">
    <header class="site-header">
      <a class="brand" href="/" :aria-label="messages.brand">
        <AudioLines :size="28" aria-hidden="true" />{{ messages.brand }}
      </a>
      <span class="stage">{{ messages.badge }}</span>
    </header>
    <main id="main" class="main-content">
      <section class="hero" aria-labelledby="welcome-title">
        <p class="eyebrow">{{ messages.eyebrow }}</p>
        <h1 id="welcome-title">{{ messages.headline }}</h1>
        <p class="intro">{{ messages.intro }}</p>
        <div class="wave" aria-hidden="true">
          <span v-for="bar in 17" :key="bar"></span>
        </div>
        <p class="tagline">{{ messages.tagline }}</p>
      </section>
      <section class="features" :aria-label="messages.brand">
        <article
          v-for="(feature, index) in messages.features"
          :key="feature.title"
          class="feature"
        >
          <component :is="featureIcons[index]" :size="24" aria-hidden="true" />
          <h2>{{ feature.title }}</h2>
          <p>{{ feature.description }}</p>
        </article>
      </section>
      <aside class="progress-note">
        <span class="progress-mark" aria-hidden="true"
          ><Sprout :size="25"
        /></span>
        <div>
          <h2>{{ messages.progressTitle }}</h2>
          <p>{{ messages.progressText }}</p>
        </div>
      </aside>
    </main>
    <footer class="site-footer">
      <p><LockKeyhole :size="15" aria-hidden="true" />{{ messages.privacy }}</p>
      <div class="service-state">
        <span role="status" aria-live="polite">{{
          messages.service[status]
        }}</span>
        <button v-if="status === 'unavailable'" type="button" @click="refresh">
          {{ messages.service.retry }}
        </button>
      </div>
    </footer>
  </div>
</template>
<script lang="ts" src="./HomePage.ts"></script>
<style scoped src="./HomePage.css"></style>
