import { createRouter, createWebHistory } from 'vue-router'

import BudgetsView from '@/views/BudgetsView.vue'
import CategoryBudgetView from '@/views/CategoryBudgetView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import DashboardView from '@/views/DashboardView.vue'
import FixedExpensesView from '@/views/FixedExpensesView.vue'
import HistoryReviewView from '@/views/HistoryReviewView.vue'
import ImportTransactionsView from '@/views/ImportTransactionsView.vue'
import LoginView from '@/views/LoginView.vue'
import MonthlySnapshotView from '@/views/MonthlySnapshotView.vue'
import SettingsView from '@/views/SettingsView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import TripsView from '@/views/TripsView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (import.meta.env.MODE === 'test') {
      return false
    }

    return savedPosition ?? { top: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true, title: '登入' },
    },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { title: '總覽' } },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
      meta: { title: '交易' },
    },
    {
      path: '/import-transactions',
      name: 'import-transactions',
      component: ImportTransactionsView,
      meta: { title: '匯入交易' },
    },
    { path: '/budgets', name: 'budgets', component: BudgetsView, meta: { title: '預算週期' } },
    {
      path: '/category-budget',
      name: 'category-budget',
      component: CategoryBudgetView,
      meta: { title: '分類預算' },
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView,
      meta: { title: '分類管理' },
    },
    {
      path: '/fixed-expenses',
      name: 'fixed-expenses',
      component: FixedExpensesView,
      meta: { title: '固定開支' },
    },
    { path: '/trips', name: 'trips', component: TripsView, meta: { title: '旅程' } },
    {
      path: '/monthly-snapshot',
      name: 'monthly-snapshot',
      component: MonthlySnapshotView,
      meta: { title: '每月快照' },
    },
    {
      path: '/history-review',
      name: 'history-review',
      component: HistoryReviewView,
      meta: { title: '歷史回顧' },
    },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '更多' } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Restore the persisted session exactly once per app boot.
  if (!auth.ready) {
    await auth.restore()
  }

  if (to.meta.public) {
    // Already signed-in users shouldn't sit on the login page.
    if (to.name === 'login' && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
