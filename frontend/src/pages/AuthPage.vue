<template>
  <main class="auth-layout">
    <RouterLink class="back-link" to="/">{{ text.home }}</RouterLink>
    <AuthForm :key="mode" :mode="mode" />
  </main>
</template>
<script lang="ts" src="./AuthPage.ts"></script>
