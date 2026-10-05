<template>
  <section class="auth-card" aria-labelledby="auth-title">
    <p class="auth-eyebrow">{{ text.brand }}</p>
    <h1 id="auth-title">{{ content.title }}</h1>
    <p class="auth-subtitle">{{ content.subtitle }}</p>
    <p v-if="resetDone" class="notice success" role="status">
      {{ text.resetDone }}
    </p>
    <form :aria-busy="busy" @submit.prevent="submit">
      <div v-if="mode === 'register'" class="field">
        <label for="name">{{ text.name }}</label>
        <input
          id="name"
          v-model="form.name"
          name="name"
          autocomplete="name"
          maxlength="100"
          required
          :aria-invalid="!!fields.name"
          :aria-describedby="fields.name ? 'name-error' : undefined"
        />
        <span v-if="fields.name" id="name-error" class="field-error">{{
          fields.name
        }}</span>
      </div>
      <div class="field">
        <label for="email">{{ text.email }}</label>
        <input
          id="email"
          v-model="form.email"
          name="email"
          type="email"
          autocomplete="email"
          maxlength="254"
          required
          :readonly="mode === 'reset'"
          :aria-invalid="!!fields.email"
          :aria-describedby="fields.email ? 'email-error' : undefined"
        />
        <span v-if="fields.email" id="email-error" class="field-error">{{
          fields.email
        }}</span>
      </div>
      <div v-if="mode !== 'forgot'" class="field">
        <label for="password">{{ text.password }}</label>
        <input
          id="password"
          v-model="form.password"
          name="password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          :minlength="mode === 'login' ? undefined : 12"
          required
          :aria-invalid="!!fields.password"
          :aria-describedby="
            fields.password
              ? 'password-error'
              : mode !== 'login'
                ? 'password-help'
                : undefined
          "
        />
        <small v-if="mode !== 'login'" id="password-help">{{
          text.passwordHelp
        }}</small>
        <span v-if="fields.password" id="password-error" class="field-error">{{
          fields.password
        }}</span>
      </div>
      <div v-if="mode === 'register' || mode === 'reset'" class="field">
        <label for="confirmation">{{ text.confirmation }}</label>
        <input
          id="confirmation"
          v-model="form.password_confirmation"
          name="password_confirmation"
          type="password"
          autocomplete="new-password"
          required
          :aria-invalid="!!fields.password_confirmation"
          :aria-describedby="
            fields.password_confirmation ? 'confirmation-error' : undefined
          "
        />
        <span
          v-if="fields.password_confirmation"
          id="confirmation-error"
          class="field-error"
          >{{ fields.password_confirmation }}</span
        >
      </div>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <p v-if="success" class="notice success" role="status">{{ success }}</p>
      <button class="primary-button" type="submit" :disabled="busy">
        {{ busy ? text.busy : content.submit }}
      </button>
    </form>
    <nav class="auth-links" aria-label="Cuenta">
      <RouterLink
        v-if="mode === 'login' || mode === 'reset'"
        to="/auth/forgot-password"
        >{{ text.forgotLink }}</RouterLink
      >
      <RouterLink v-if="mode === 'login'" to="/auth/register">{{
        text.registerLink
      }}</RouterLink>
      <RouterLink v-else to="/auth/login">{{ text.loginLink }}</RouterLink>
    </nav>
  </section>
</template>
<script lang="ts" src="./AuthForm.ts"></script>
