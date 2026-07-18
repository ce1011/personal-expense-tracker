import { createRouter, createWebHistory } from 'vue-router'

import BudgetsView from '@/views/BudgetsView.vue'
import CategoryBudgetView from '@/views/CategoryBudgetView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import DashboardView from '@/views/DashboardView.vue'
import FixedExpensesView from '@/views/FixedExpensesView.vue'
import ImportTransactionsView from '@/views/ImportTransactionsView.vue'
import LoginView from '@/views/LoginView.vue'
import MonthlySnapshotView from '@/views/MonthlySnapshotView.vue'
import SettingsView from '@/views/SettingsView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import TripsView from '@/views/TripsView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    {
      path: '/import-transactions',
      name: 'import-transactions',
      component: ImportTransactionsView,
    },
    { path: '/budgets', name: 'budgets', component: BudgetsView },
    { path: '/category-budget', name: 'category-budget', component: CategoryBudgetView },
    { path: '/categories', name: 'categories', component: CategoriesView },
    { path: '/fixed-expenses', name: 'fixed-expenses', component: FixedExpensesView },
    { path: '/trips', name: 'trips', component: TripsView },
    { path: '/monthly-snapshot', name: 'monthly-snapshot', component: MonthlySnapshotView },
    { path: '/settings', name: 'settings', component: SettingsView },
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
