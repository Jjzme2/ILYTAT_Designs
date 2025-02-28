<template>
  <button
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__loader">
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
    </span>
    <span v-else class="base-button__content">
      <slot name="icon-left"></slot>
      <slot>{{ label }}</slot>
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    label: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click']
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  gap: 0.5rem;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.base-button--primary {
  background-color: var(--color-primary);
  color: white;
}

.base-button--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.base-button--secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}

.base-button--secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-dark);
}

.base-button--danger {
  background-color: var(--color-danger);
  color: white;
}

.base-button--danger:hover:not(:disabled) {
  background-color: var(--color-danger-dark);
}

.base-button--ghost {
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.base-button--ghost:hover:not(:disabled) {
  background-color: var(--color-background-hover);
}

/* Sizes */
.base-button--small {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.base-button--medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.base-button--large {
  padding: 0.75rem 1.25rem;
  font-size: 1.125rem;
}

/* Loading state */
.base-button__loader {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.loader-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: currentColor;
  border-radius: 50%;
  animation: loader 0.6s infinite alternate;
}

.loader-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loader-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loader {
  to {
    opacity: 0.3;
    transform: translateY(-0.25rem);
  }
}
</style>
