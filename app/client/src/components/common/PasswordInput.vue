`<template>
  <div class="password-input-container">
    <label v-if="label" :for="id" class="form-label">{{ label }}</label>
    <div class="input-group">
      <input
        :type="showPassword ? 'text' : 'password'"
        :id="id"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="form-control"
        :placeholder="placeholder"
        :required="required"
        :minlength="minLength"
        :autocomplete="autocomplete"
      />
      <button
        type="button"
        class="btn btn-outline-secondary"
        @click="togglePasswordVisibility"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
      >
        <!-- <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i> -->
        <i :class="showPassword ? '🔐' : '👁'"></i>
      </button>
    </div>
    <div v-if="error" class="invalid-feedback d-block">
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PasswordInput',
  props: {
    modelValue: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    minLength: {
      type: Number,
      default: 8
    },
    error: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      required: true
    },
    autocomplete: {
      type: String,
      default: 'current-password'
    },
    showPasswordByDefault: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showPassword: this.showPasswordByDefault
    }
  },
  methods: {
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    }
  }
}
</script>

<style scoped>
.password-input-container {
  width: 100%;
}

.input-group {
  position: relative;
}

.input-group .btn {
  border-left: none;
}

.input-group .btn:hover {
  background-color: transparent;
}

.input-group .btn:focus {
  box-shadow: none;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.invalid-feedback {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>`
