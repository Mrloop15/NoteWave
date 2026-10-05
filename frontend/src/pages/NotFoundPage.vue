<template>
  <main class="not-found">
    <p>404</p>
    <h1>{{ messages.notFound }}</h1>
    <RouterLink to="/">{{ messages.backHome }}</RouterLink>
  </main>
</template>
<script lang="ts" src="./NotFoundPage.ts"></script>
<style scoped src="./NotFoundPage.css"></style>
