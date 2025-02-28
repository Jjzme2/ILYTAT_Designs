<template>
  <div class="documentation-list">
    <header class="view-header">
      <h1>Documentation</h1>
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search documentation..."
          class="search-input"
        />
      </div>
    </header>

    <div class="documentation-grid">
      <div class="category-section" v-for="category in categories" :key="category.id">
        <h2 class="category-title">{{ category.title }}</h2>
        <div class="articles-grid">
          <router-link
            v-for="article in filterArticles(category.articles)"
            :key="article.id"
            :to="`/documentation/${article.slug}`"
            class="article-card"
          >
            <div class="article-icon">{{ article.icon }}</div>
            <div class="article-content">
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-description">{{ article.description }}</p>
              <div class="article-meta">
                <span class="article-date">
                  Updated {{ formatDate(article.updatedAt) }}
                </span>
                <span v-if="article.readTime" class="article-read-time">
                  {{ article.readTime }} min read
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'DocumentationListView',
  setup() {
    const searchQuery = ref('')

    const categories = ref([
      {
        id: 1,
        title: 'Getting Started',
        articles: [
          {
            id: 1,
            title: 'Quick Start Guide',
            description: 'Learn how to set up your ILYTAT Designs account and create your first product',
            slug: 'quick-start-guide',
            icon: '🚀',
            updatedAt: '2025-02-20',
            readTime: 5
          },
          {
            id: 2,
            title: 'Platform Overview',
            description: 'Understanding the ILYTAT Designs platform and its features',
            slug: 'platform-overview',
            icon: '📱',
            updatedAt: '2025-02-18',
            readTime: 8
          }
        ]
      },
      {
        id: 2,
        title: 'Printify Integration',
        articles: [
          {
            id: 3,
            title: 'Connecting Your Shop',
            description: 'Step-by-step guide to connect your Printify shop',
            slug: 'connecting-printify-shop',
            icon: '🔗',
            updatedAt: '2025-02-15',
            readTime: 3
          },
          {
            id: 4,
            title: 'Managing Products',
            description: 'Learn how to manage your Printify products effectively',
            slug: 'managing-printify-products',
            icon: '📦',
            updatedAt: '2025-02-10',
            readTime: 10
          }
        ]
      },
      {
        id: 3,
        title: 'Best Practices',
        articles: [
          {
            id: 5,
            title: 'Design Guidelines',
            description: 'Best practices for creating successful print-on-demand designs',
            slug: 'design-guidelines',
            icon: '🎨',
            updatedAt: '2025-02-05',
            readTime: 12
          },
          {
            id: 6,
            title: 'SEO Optimization',
            description: 'Tips for optimizing your products for better visibility',
            slug: 'seo-optimization',
            icon: '🔍',
            updatedAt: '2025-02-01',
            readTime: 7
          }
        ]
      }
    ])

    const filterArticles = (articles) => {
      if (!searchQuery.value) return articles

      const query = searchQuery.value.toLowerCase()
      return articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
      )
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    return {
      searchQuery,
      categories,
      filterArticles,
      formatDate
    }
  }
}
</script>

<style>
.documentation-list {
  padding: var(--spacing-4);
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: var(--spacing-6);
}

.search-bar {
  margin-top: var(--spacing-4);
}

.search-input {
  width: 100%;
  max-width: 600px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.category-section {
  margin-bottom: var(--spacing-8);
}

.category-title {
  margin-bottom: var(--spacing-4);
  color: var(--color-text);
  font-size: 1.5rem;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.article-card {
  display: flex;
  background: var(--color-background-alt);
  border-radius: var(--radius);
  padding: var(--spacing-4);
  text-decoration: none;
  color: var(--color-text);
  transition: transform 0.2s, box-shadow 0.2s;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.article-icon {
  font-size: 2rem;
  margin-right: var(--spacing-4);
  display: flex;
  align-items: center;
}

.article-content {
  flex: 1;
}

.article-title {
  margin-bottom: var(--spacing-2);
  color: var(--color-text);
}

.article-description {
  color: var(--color-text-light);
  margin-bottom: var(--spacing-3);
  font-size: 0.875rem;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-light);
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }

  .article-card {
    flex-direction: column;
  }

  .article-icon {
    margin-right: 0;
    margin-bottom: var(--spacing-3);
  }

  .article-meta {
    flex-direction: column;
    gap: var(--spacing-1);
  }
}
</style>
