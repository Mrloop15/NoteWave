<template>
  <main class="auth-layout workspace-layout">
    <header class="workspace-header">
      <RouterLink class="back-link" to="/">{{ text.brand }}</RouterLink
      ><button class="text-button" :disabled="busy" @click="logout">
        {{ text.logout }}
      </button>
    </header>
    <section class="auth-card" aria-labelledby="workspace-title">
      <p class="auth-eyebrow">{{ session.user?.name }}</p>
      <h1 id="workspace-title">{{ text.workspaceTitle }}</h1>
      <p class="auth-subtitle">{{ text.workspaceIntro }}</p>
      <div class="account-summary">
        <h2>{{ text.account }}</h2>
        <p>{{ session.user?.email }}</p>
        <span class="verified-badge">{{ text.verified }}</span>
      </div>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>
<script lang="ts" src="./WorkspacePage.ts"></script>
