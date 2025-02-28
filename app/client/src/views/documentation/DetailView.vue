<template>
  <div class="documentation-detail">
    <nav class="breadcrumb">
      <router-link to="/documentation" class="breadcrumb-link">
        Documentation
      </router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">{{ article?.title }}</span>
    </nav>

    <div v-if="loading" class="loading-state">
      Loading article...
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <article v-else class="article-content">
      <header class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <span class="article-date">
            Last updated {{ formatDate(article.updatedAt) }}
          </span>
          <span class="article-read-time">
            {{ article.readTime }} min read
          </span>
        </div>
      </header>

      <div class="table-of-contents" v-if="tableOfContents.length">
        <h2>Table of Contents</h2>
        <ul>
          <li v-for="item in tableOfContents" :key="item.id">
            <a :href="`#${item.id}`" class="toc-link">
              {{ item.title }}
            </a>
          </li>
        </ul>
      </div>

      <div class="article-body" v-html="article.content"></div>

      <footer class="article-footer">
        <div class="article-feedback">
          <p>Was this article helpful?</p>
          <div class="feedback-buttons">
            <button
              class="btn btn-secondary"
              :class="{ active: feedback === 'yes' }"
              @click="submitFeedback('yes')"
            >
              👍 Yes
            </button>
            <button
              class="btn btn-secondary"
              :class="{ active: feedback === 'no' }"
              @click="submitFeedback('no')"
            >
              👎 No
            </button>
          </div>
        </div>

        <div class="article-navigation">
          <router-link
            v-if="prevArticle"
            :to="`/documentation/${prevArticle.slug}`"
            class="nav-link prev"
          >
            <span class="nav-direction">Previous</span>
            <span class="nav-title">{{ prevArticle.title }}</span>
          </router-link>

          <router-link
            v-if="nextArticle"
            :to="`/documentation/${nextArticle.slug}`"
            class="nav-link next"
          >
            <span class="nav-direction">Next</span>
            <span class="nav-title">{{ nextArticle.title }}</span>
          </router-link>
        </div>
      </footer>
    </article>

    <aside class="article-sidebar">
      <div class="sidebar-section">
        <h3>Related Articles</h3>
        <ul class="related-articles">
          <li v-for="related in relatedArticles" :key="related.id">
            <router-link :to="`/documentation/${related.slug}`">
              {{ related.title }}
            </router-link>
          </li>
        </ul>
      </div>

      <div class="sidebar-section">
        <h3>Need Help?</h3>
        <p>Can't find what you're looking for?</p>
        <button class="btn btn-primary" @click="contactSupport">
          Contact Support
        </button>
      </div>
    </aside>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'

export default {
  name: 'DocumentationDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const uiStore = useUIStore()
    
    const loading = ref(true)
    const error = ref(null)
    const article = ref(null)
    const feedback = ref(null)
    const tableOfContents = ref([])
    const relatedArticles = ref([])
    const prevArticle = ref(null)
    const nextArticle = ref(null)

    const loadArticle = async (slug) => {
      try {
        loading.value = true
        error.value = null

        // Mock data - replace with actual API call
        article.value = {
          id: 1,
          title: 'Quick Start Guide',
          content: `
            <h2 id="introduction">Introduction</h2>
            <p>Welcome to ILYTAT Designs! This guide will help you get started...</p>

            <h2 id="setup">Setting Up Your Account</h2>
            <p>Follow these steps to set up your account...</p>

            <h2 id="first-product">Creating Your First Product</h2>
            <p>Learn how to create and publish your first product...</p>
          `,
          updatedAt: '2025-02-20',
          readTime: 5
        }

        // Generate table of contents
        tableOfContents.value = [
          { id: 'introduction', title: 'Introduction' },
          { id: 'setup', title: 'Setting Up Your Account' },
          { id: 'first-product', title: 'Creating Your First Product' }
        ]

        // Load related articles
        relatedArticles.value = [
          { id: 2, title: 'Platform Overview', slug: 'platform-overview' },
          { id: 3, title: 'Connecting Your Shop', slug: 'connecting-printify-shop' }
        ]

        // Set navigation articles
        prevArticle.value = { id: 2, title: 'Platform Overview', slug: 'platform-overview' }
        nextArticle.value = { id: 3, title: 'Connecting Your Shop', slug: 'connecting-printify-shop' }

      } catch (err) {
        error.value = 'Failed to load article'
        uiStore.notifyError('Failed to load article')
      } finally {
        loading.value = false
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const submitFeedback = async (value) => {
      feedback.value = value
      try {
        // Mock API call - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 500))
        uiStore.notifySuccess('Thank you for your feedback!')
      } catch (error) {
        uiStore.notifyError('Failed to submit feedback')
      }
    }

    const contactSupport = () => {
      // Implement support contact logic
      uiStore.openModal('support-contact')
    }

    watch(() => route.params.slug, (newSlug) => {
      if (newSlug) {
        loadArticle(newSlug)
      }
    })

    onMounted(() => {
      if (route.params.slug) {
        loadArticle(route.params.slug)
      }
    })

    return {
      loading,
      error,
      article,
      tableOfContents,
      relatedArticles,
      prevArticle,
      nextArticle,
      feedback,
      formatDate,
      submitFeedback,
      contactSupport
    }
  }
}
</script>

<style>
.documentation-detail {
  padding: var(--spacing-4);
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-8);
}

.breadcrumb {
  grid-column: 1 / -1;
  margin-bottom: var(--spacing-6);
  color: var(--color-text-light);
}

.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
}

.breadcrumb-separator {
  margin: 0 var(--spacing-2);
}

.article-content {
  background: var(--color-background-alt);
  border-radius: var(--radius);
  padding: var(--spacing-6);
}

.article-header {
  margin-bottom: var(--spacing-6);
}

.article-meta {
  display: flex;
  gap: var(--spacing-4);
  color: var(--color-text-light);
  margin-top: var(--spacing-2);
}

.table-of-contents {
  background: var(--color-background);
  border-radius: var(--radius);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.table-of-contents ul {
  list-style: none;
  padding: 0;
  margin: var(--spacing-3) 0 0;
}

.toc-link {
  color: var(--color-text);
  text-decoration: none;
  display: block;
  padding: var(--spacing-2) 0;
}

.toc-link:hover {
  color: var(--color-primary);
}

.article-body {
  line-height: 1.6;
}

.article-body h2 {
  margin: var(--spacing-6) 0 var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

.article-footer {
  margin-top: var(--spacing-8);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-border);
}

.article-feedback {
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.feedback-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-3);
}

.feedback-buttons .btn.active {
  background: var(--color-primary);
  color: var(--color-background);
}

.article-navigation {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.nav-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
}

.nav-link:hover {
  background: var(--color-background);
}

.nav-direction {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.nav-title {
  color: var(--color-primary);
}

.nav-link.next {
  text-align: right;
}

.article-sidebar {
  position: sticky;
  top: var(--spacing-4);
  align-self: start;
}

.sidebar-section {
  background: var(--color-background-alt);
  border-radius: var(--radius);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.sidebar-section h3 {
  margin-bottom: var(--spacing-3);
}

.related-articles {
  list-style: none;
  padding: 0;
}

.related-articles li {
  margin-bottom: var(--spacing-2);
}

.related-articles a {
  color: var(--color-text);
  text-decoration: none;
}

.related-articles a:hover {
  color: var(--color-primary);
}

.loading-state,
.error-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-text-light);
}

@media (max-width: 1024px) {
  .documentation-detail {
    grid-template-columns: 1fr;
  }

  .article-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .article-navigation {
    grid-template-columns: 1fr;
  }

  .nav-link.next {
    text-align: left;
  }
}
</style>
