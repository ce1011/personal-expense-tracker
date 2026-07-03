import { createRouter, createWebHistory } from 'vue-router'

import BudgetsView from '@/views/BudgetsView.vue'
import CategoryBudgetView from '@/views/CategoryBudgetView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ImportTransactionsView from '@/views/ImportTransactionsView.vue'
import MonthlySnapshotView from '@/views/MonthlySnapshotView.vue'
import SettingsView from '@/views/SettingsView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import TripsView from '@/views/TripsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    { path: '/trips', name: 'trips', component: TripsView },
    { path: '/monthly-snapshot', name: 'monthly-snapshot', component: MonthlySnapshotView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
