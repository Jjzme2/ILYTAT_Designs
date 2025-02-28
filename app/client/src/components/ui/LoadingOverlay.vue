<template>
  <div class="loading-overlay">
    <div class="loading-overlay__content">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading...</span>
    </div>
  </div>
</template>

<script>
/**
 * LoadingOverlay Component
 * 
 * A full-screen overlay that displays a loading spinner and text.
 * Used to indicate background processing or page loading states.
 * 
 * @displayName LoadingOverlay
 * @example
 * <LoadingOverlay />
 */
export default {
  name: 'LoadingOverlay'
}
</script>

<style>
@import '../../styles/components/loading-overlay.css';
</style>
