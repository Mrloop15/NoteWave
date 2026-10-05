<template>
  <main class="auth-layout">
    <RouterLink class="back-link" to="/">{{ text.home }}</RouterLink>
    <section class="auth-card" aria-labelledby="verify-title">
      <p class="auth-eyebrow">{{ text.brand }}</p>
      <h1 id="verify-title">{{ text.verifyTitle }}</h1>
      <p>
        {{ text.verifyIntro }} <strong>{{ session.user?.email }}</strong
        >.
      </p>
      <p class="auth-subtitle">{{ text.verifyHelp }}</p>
      <p v-if="busy" role="status">{{ text.busy }}</p>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <p v-if="message" class="notice success" role="status">{{ message }}</p>
      <div class="button-stack">
        <button class="primary-button" :disabled="busy" @click="check">
          {{ text.checkVerified }}
        </button>
        <button
          class="secondary-button"
          :disabled="busy || cooldown > 0"
          @click="resend"
        >
          {{ text.resend }}
        </button>
        <p v-if="cooldown > 0" role="status">
          {{ text.cooldown }} {{ cooldown }} {{ text.seconds }}
        </p>
        <button class="text-button" :disabled="busy" @click="logout">
          {{ text.logout }}
        </button>
      </div>
    </section>
  </main>
</template>
<script lang="ts" src="./VerifyEmailPage.ts"></script>
