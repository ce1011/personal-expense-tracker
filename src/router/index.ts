import { createRouter, createWebHistory } from 'vue-router'

import BudgetsView from '@/views/BudgetsView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import TransactionsView from '@/views/TransactionsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    { path: '/budgets', name: 'budgets', component: BudgetsView },
    { path: '/categories', name: 'categories', component: CategoriesView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
