<template>
  <div class="layout layout--auth">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-logo">ILYTAT Designs</h1>
      </div>
      <div class="auth-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>

<style>
.layout--auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-alt);
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-4);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.auth-logo {
  font-size: 2rem;
  color: var(--color-primary);
  margin: 0;
}

.auth-content {
  background: var(--color-background);
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

@media (max-width: 480px) {
  .auth-container {
    padding: var(--spacing-2);
  }

  .auth-content {
    padding: var(--spacing-4);
  }
}
</style>
