<template>
  <main class="account-settings">
    <RouterLink to="/app" class="account-back"
      ><ArrowLeft :size="18" aria-hidden="true" />{{ text.back }}</RouterLink
    >
    <header class="account-heading">
      <p>NoteWave</p>
      <h1>{{ text.title }}</h1>
      <span>{{ text.subtitle }}</span>
    </header>
    <div class="account-grid">
      <section class="account-card" aria-labelledby="profile-heading">
        <div class="card-icon"><UserRound :size="22" aria-hidden="true" /></div>
        <h2 id="profile-heading">{{ text.profile }}</h2>
        <p class="card-intro">{{ text.profileHelp }}</p>
        <p class="account-email">
          <Check :size="15" aria-hidden="true" /><span
            >{{ session.user?.email }}<small>{{ text.email }}</small></span
          >
        </p>
        <form @submit.prevent="save">
          <fieldset :disabled="!!busy">
            <div class="field">
              <label for="profile-name">{{ text.name }}</label
              ><input
                id="profile-name"
                v-model="form.name"
                autocomplete="name"
                required
                maxlength="100"
                :aria-invalid="!!fields.name"
                :aria-describedby="
                  fields.name ? 'profile-name-error' : undefined
                "
              /><span
                v-if="fields.name"
                id="profile-name-error"
                class="field-error"
                >{{ fields.name }}</span
              >
            </div>
            <div class="preference-field">
              <AppDropdown
                id="profile-language"
                v-model="form.dictation_language"
                :label="text.language"
                :options="languageOptions"
                :disabled="!!busy"
              />
              <p v-if="fields.dictation_language" class="field-error">
                {{ fields.dictation_language }}
              </p>
            </div>
            <p v-if="loading" role="status">{{ text.loading }}</p>
            <div v-else-if="loadError">
              <p role="alert" class="notice error">{{ loadError }}</p>
              <button
                type="button"
                class="secondary-button"
                @click="loadOptions"
              >
                {{ text.retry }}
              </button>
            </div>
            <div v-else class="preference-field">
              <AppDropdown
                id="profile-timezone"
                v-model="form.timezone"
                :label="text.timezone"
                :options="timezoneOptions"
                :disabled="!!busy"
              />
              <p v-if="fields.timezone" class="field-error">
                {{ fields.timezone }}
              </p>
            </div>
            <p class="field-help">{{ text.timezoneHelp }}</p>
            <p v-if="error" role="alert" class="notice error">{{ error }}</p>
            <p v-if="notice" role="status" class="notice success">
              {{ notice }}
            </p>
            <button
              v-if="conflict"
              type="button"
              class="secondary-button"
              @click="reload"
            >
              {{ text.reload }}
            </button>
            <div class="account-actions">
              <span>{{ dirty ? text.pending : '' }}</span
              ><button
                class="primary-button"
                :disabled="!dirty || conflict || loading || !!loadError"
              >
                <Save :size="17" aria-hidden="true" />{{
                  busy === 'profile' ? text.saving : text.save
                }}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
      <section class="account-card" aria-labelledby="security-heading">
        <div class="card-icon">
          <ShieldCheck :size="22" aria-hidden="true" />
        </div>
        <h2 id="security-heading">{{ text.security }}</h2>
        <p class="card-intro">{{ text.securityHelp }}</p>
        <form @submit.prevent="changePassword">
          <fieldset :disabled="!!busy">
            <div class="field">
              <label for="current-password">{{ text.currentPassword }}</label
              ><input
                id="current-password"
                v-model="password.current_password"
                type="password"
                autocomplete="current-password"
                required
                :aria-invalid="!!passwordFields.current_password"
                :aria-describedby="
                  passwordFields.current_password
                    ? 'current-password-error'
                    : undefined
                "
              /><span
                v-if="passwordFields.current_password"
                id="current-password-error"
                class="field-error"
                >{{ passwordFields.current_password }}</span
              >
            </div>
            <div class="field">
              <label for="new-password">{{ text.password }}</label
              ><input
                id="new-password"
                v-model="password.password"
                type="password"
                autocomplete="new-password"
                required
                minlength="12"
                :aria-invalid="!!passwordFields.password"
                :aria-describedby="
                  passwordFields.password ? 'new-password-error' : undefined
                "
              /><span
                v-if="passwordFields.password"
                id="new-password-error"
                class="field-error"
                >{{ passwordFields.password }}</span
              >
            </div>
            <div class="field">
              <label for="confirm-new-password">{{
                text.confirmPassword
              }}</label
              ><input
                id="confirm-new-password"
                v-model="password.password_confirmation"
                type="password"
                autocomplete="new-password"
                required
                minlength="12"
              />
            </div>
            <p v-if="passwordError" role="alert" class="notice error">
              {{ passwordError }} {{ text.passwordNotice }}
            </p>
            <p v-if="passwordNotice" role="status" class="notice success">
              {{ passwordNotice }}
            </p>
            <button class="secondary-button password-submit">
              <ShieldCheck :size="17" aria-hidden="true" />{{
                busy === 'password' ? text.saving : text.changePassword
              }}
            </button>
          </fieldset>
        </form>
      </section>
    </div>
  </main>
</template>
<script lang="ts" src="./AccountSettings.ts"></script>
<style scoped src="./AccountSettings.css"></style>
