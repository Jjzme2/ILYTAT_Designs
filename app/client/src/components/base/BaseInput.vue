<template>
  <div class="base-input" :class="{ 'base-input--error': error }">
    <label v-if="label" :for="id" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    
    <div class="base-input__wrapper">
      <slot name="prefix"></slot>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        class="base-input__field"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
      <slot name="suffix"></slot>
    </div>

    <span v-if="error" class="base-input__error">{{ error }}</span>
    <span v-else-if="hint" class="base-input__hint">{{ hint }}</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    },
    error: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    autocomplete: {
      type: String,
      default: 'off'
    }
  },
  emits: ['update:modelValue', 'blur', 'focus']
})
</script>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.base-input__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.base-input__required {
  color: var(--color-danger);
  margin-left: 0.25rem;
}

.base-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input__field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
  background-color: var(--color-background);
  transition: all 0.2s;
}

.base-input__field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.base-input__field:disabled {
  background-color: var(--color-background-disabled);
  cursor: not-allowed;
}

.base-input--error .base-input__field {
  border-color: var(--color-danger);
}

.base-input--error .base-input__field:focus {
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.base-input__error {
  font-size: 0.875rem;
  color: var(--color-danger);
}

.base-input__hint {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

/* Slots styling */
.base-input__wrapper :slotted([slot="prefix"]) {
  position: absolute;
  left: 0.75rem;
  color: var(--color-text-light);
}

.base-input__wrapper :slotted([slot="suffix"]) {
  position: absolute;
  right: 0.75rem;
  color: var(--color-text-light);
}

.base-input__wrapper:has([slot="prefix"]) .base-input__field {
  padding-left: 2.5rem;
}

.base-input__wrapper:has([slot="suffix"]) .base-input__field {
  padding-right: 2.5rem;
}
</style>
